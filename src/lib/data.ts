import { db } from './firebase';
import { collection, doc, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction, writeBatch, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './errorHelper';
import { Transaction, Fund, Debt, UserStats, UserCategoryMapping } from '../types';
import { auth } from './firebase';

export function listenToCollection<T>(path: string, callback: (data: T[]) => void) {
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export function listenToTransactions(path: string, callback: (data: Transaction[]) => void) {
  const q = query(collection(db, path), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      callback(data);
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export function listenToCategoryMappings(userId: string, callback: (data: UserCategoryMapping[]) => void) {
  return listenToCollection<UserCategoryMapping>(`users/${userId}/categoryMappings`, callback);
}

export function listenToDoc<T>(path: string, callback: (data: T) => void) {
  return onSnapshot(
    doc(db, path),
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

// Write Operations
// Note: adding transaction updates the relevant Fund/Debt balances and UserStats atomically
export async function addTransaction(
  userId: string,
  txData: Omit<Transaction, 'id' | 'createdAt'>
) {
  try {
    await runTransaction(db, async (transaction) => {
      const statsRef = doc(db, 'users', userId);
      const statsDoc = await transaction.get(statsRef);
      if (!statsDoc.exists()) throw new Error('User stats not found');
      
      const stats = statsDoc.data() as UserStats;
      let { totalBalance, totalDebt, totalLent } = stats;

      let fundRef, fundDoc, fundData;
      if (txData.fundId) {
        fundRef = doc(db, `users/${userId}/funds`, txData.fundId);
        fundDoc = await transaction.get(fundRef);
        if (fundDoc.exists()) {
          fundData = fundDoc.data() as Fund;
        }
      }

      let debtRef, debtDoc, debtData;
      if (txData.debtId) {
        debtRef = doc(db, `users/${userId}/debts`, txData.debtId);
        debtDoc = await transaction.get(debtRef);
        if (debtDoc.exists()) {
          debtData = debtDoc.data() as Debt;
        }
      }

      // Calculate logic
      const amount = txData.amount;
      
      if (txData.type === 'income') {
        totalBalance += amount;
        if (fundData && fundRef) transaction.update(fundRef, { balance: fundData.balance + amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'expense') {
        totalBalance -= amount;
        if (fundData && fundRef) transaction.update(fundRef, { balance: fundData.balance - amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'debt_increase') {
        // I borrowed more money -> my balance increases (got cash), totalDebt increases
        totalBalance += amount;
        totalDebt += amount;
        if (debtData && debtRef && debtData.type === 'borrowed') {
          transaction.update(debtRef, { amount: debtData.amount + amount, updatedAt: serverTimestamp() });
        }
        // we can also add this cash to a fund if fundId is provided
        if (fundData && fundRef) transaction.update(fundRef, { balance: fundData.balance + amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'debt_decrease') {
        // I repay my debt -> balance decreases, totalDebt decreases
        totalBalance -= amount;
        totalDebt -= amount;
        if (debtData && debtRef && debtData.type === 'borrowed') {
          transaction.update(debtRef, { amount: Math.max(0, debtData.amount - amount), updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) transaction.update(fundRef, { balance: fundData.balance - amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'lend_increase') {
        // I lend money to someone -> balance decreases, totalLent increases
        totalBalance -= amount;
        totalLent += amount;
        if (debtData && debtRef && debtData.type === 'lent') {
          transaction.update(debtRef, { amount: debtData.amount + amount, updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) transaction.update(fundRef, { balance: fundData.balance - amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'lend_decrease') {
        // Someone repays me -> balance increases, totalLent decreases 
        totalBalance += amount;
        totalLent -= amount;
        if (debtData && debtRef && debtData.type === 'lent') {
           transaction.update(debtRef, { amount: Math.max(0, debtData.amount - amount), updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) transaction.update(fundRef, { balance: fundData.balance + amount, updatedAt: serverTimestamp() });
      }

      // Update stats
      transaction.update(statsRef, {
        totalBalance,
        totalDebt,
        totalLent,
        updatedAt: serverTimestamp()
      });

      // User preference mapping
      if (txData.categoryId && txData.description) {
        // extract the first word or the whole thing up to a certain length as a keyword
        // Wait, for now let's just use the exact lowercase description.
        const keyword = txData.description.toLowerCase().trim();
        // Since we are inside a transaction, we can't easily query with 'where' clause here 
        // without knowing the ID. Let's just create an ID based on hash or just slugified keyword.
        // Quick hash for keyword
        const mappingId = btoa(encodeURIComponent(keyword)).replace(/[=+\/]/g, '').slice(0, 20);
        const mappingRef = doc(db, `users/${userId}/categoryMappings`, mappingId);
        // We will just do a set with merge to increment (can't easily increment inside set merge without FieldValue, but we don't care that much about exact count for now, just saving the latest preferred category is enough for simple learning)
        transaction.set(mappingRef, {
          keyword,
          categoryId: txData.categoryId,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Add transaction record
      const newTxRef = doc(collection(db, `users/${userId}/transactions`));
      transaction.set(newTxRef, {
        ...txData,
        createdAt: serverTimestamp()
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/transactions`);
  }
}

// ... more simple operations ...
export async function addFund(userId: string, data: {name: string, color: string}) {
  try {
    await addDoc(collection(db, `users/${userId}/funds`), {
      ...data,
      balance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/funds`);
  }
}

export async function addDebt(userId: string, data: {contactName: string, type: 'borrowed' | 'lent', amount: number}) {
  try {
    // If setting an initial amount > 0, we should probably update userStats, 
    // but typically we can just add a transaction to do it correctly.
    await runTransaction(db, async (txn) => {
       const debtRef = doc(collection(db, `users/${userId}/debts`));
       txn.set(debtRef, {
         ...data,
         amount: 0, // initially 0, we log a transaction for the amount
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
       });

       if (data.amount > 0) {
         const newTxRef = doc(collection(db, `users/${userId}/transactions`));
         const txType = data.type === 'borrowed' ? 'debt_increase' : 'lend_increase';
         
         const statsRef = doc(db, 'users', userId);
         const statsDoc = await txn.get(statsRef);
         if (statsDoc.exists()) {
           const stats = statsDoc.data() as UserStats;
           let { totalBalance, totalDebt, totalLent } = stats;
           if (data.type === 'borrowed') {
              totalBalance += data.amount;
              totalDebt += data.amount;
           } else {
              totalBalance -= data.amount;
              totalLent += data.amount;
           }
           txn.update(statsRef, { totalBalance, totalDebt, totalLent, updatedAt: serverTimestamp() });
         }

         txn.set(newTxRef, {
           type: txType,
           amount: data.amount,
           description: `Initial ${data.type} balance to/from ${data.contactName}`,
           contact: data.contactName,
           debtId: debtRef.id,
           date: new Date().toISOString(),
           createdAt: serverTimestamp()
         });

         txn.update(debtRef, { amount: data.amount });
       }
    });

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/debts`);
  }
}

// Reverse Write Operation
export async function deleteTransaction(userId: string, txId: string) {
  try {
    await runTransaction(db, async (txn) => {
      const txRef = doc(db, `users/${userId}/transactions`, txId);
      const txDoc = await txn.get(txRef);
      if (!txDoc.exists()) return;
      const txData = txDoc.data() as Transaction;
      
      const statsRef = doc(db, 'users', userId);
      const statsDoc = await txn.get(statsRef);
      if (!statsDoc.exists()) throw new Error('User stats not found');
      
      const stats = statsDoc.data() as UserStats;
      let { totalBalance, totalDebt, totalLent } = stats;

      let fundRef, fundDoc, fundData;
      if (txData.fundId) {
        fundRef = doc(db, `users/${userId}/funds`, txData.fundId);
        fundDoc = await txn.get(fundRef);
        if (fundDoc.exists()) fundData = fundDoc.data() as Fund;
      }

      let debtRef, debtDoc, debtData;
      if (txData.debtId) {
        debtRef = doc(db, `users/${userId}/debts`, txData.debtId);
        debtDoc = await txn.get(debtRef);
        if (debtDoc.exists()) debtData = debtDoc.data() as Debt;
      }

      const amount = txData.amount;
      
      // REVERSE LOGIC
      if (txData.type === 'income') {
        totalBalance -= amount;
        if (fundData && fundRef) txn.update(fundRef, { balance: fundData.balance - amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'expense') {
        totalBalance += amount;
        if (fundData && fundRef) txn.update(fundRef, { balance: fundData.balance + amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'debt_increase') {
        totalBalance -= amount;
        totalDebt -= amount;
        if (debtData && debtRef && debtData.type === 'borrowed') {
          txn.update(debtRef, { amount: Math.max(0, debtData.amount - amount), updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) txn.update(fundRef, { balance: fundData.balance - amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'debt_decrease') {
        totalBalance += amount;
        totalDebt += amount;
        if (debtData && debtRef && debtData.type === 'borrowed') {
          txn.update(debtRef, { amount: debtData.amount + amount, updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) txn.update(fundRef, { balance: fundData.balance + amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'lend_increase') {
        totalBalance += amount;
        totalLent -= amount;
        if (debtData && debtRef && debtData.type === 'lent') {
          txn.update(debtRef, { amount: Math.max(0, debtData.amount - amount), updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) txn.update(fundRef, { balance: fundData.balance + amount, updatedAt: serverTimestamp() });
      } else if (txData.type === 'lend_decrease') {
        totalBalance -= amount;
        totalLent += amount;
        if (debtData && debtRef && debtData.type === 'lent') {
           txn.update(debtRef, { amount: debtData.amount + amount, updatedAt: serverTimestamp() });
        }
        if (fundData && fundRef) txn.update(fundRef, { balance: fundData.balance - amount, updatedAt: serverTimestamp() });
      }

      txn.update(statsRef, {
        totalBalance,
        totalDebt,
        totalLent,
        updatedAt: serverTimestamp()
      });

      txn.delete(txRef);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/transactions`);
  }
}

