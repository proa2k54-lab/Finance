import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Ăn uống', icon: 'Utensils', color: 'bg-orange-100 text-orange-600', type: 'expense' },
  { id: 'cat-drink', name: 'Đồ uống', icon: 'Coffee', color: 'bg-amber-100 text-amber-600', type: 'expense' },
  { id: 'cat-transport', name: 'Di chuyển', icon: 'Car', color: 'bg-blue-100 text-blue-600', type: 'expense' },
  { id: 'cat-shopping', name: 'Mua sắm', icon: 'ShoppingBag', color: 'bg-pink-100 text-pink-600', type: 'expense' },
  { id: 'cat-bills', name: 'Hóa đơn', icon: 'FileText', color: 'bg-purple-100 text-purple-600', type: 'expense' },
  { id: 'cat-home', name: 'Nhà cửa', icon: 'Home', color: 'bg-teal-100 text-teal-600', type: 'expense' },
  { id: 'cat-entertainment', name: 'Giải trí', icon: 'Tv', color: 'bg-indigo-100 text-indigo-600', type: 'expense' },
  { id: 'cat-health', name: 'Sức khỏe', icon: 'HeartPulse', color: 'bg-rose-100 text-rose-600', type: 'expense' },
  { id: 'cat-education', name: 'Giáo dục', icon: 'BookOpen', color: 'bg-cyan-100 text-cyan-600', type: 'expense' },
  { id: 'cat-family', name: 'Gia đình', icon: 'Users', color: 'bg-emerald-100 text-emerald-600', type: 'expense' },
  { id: 'cat-work', name: 'Công việc', icon: 'Briefcase', color: 'bg-slate-100 text-slate-600', type: 'expense' },
  { id: 'cat-savings', name: 'Tiết kiệm', icon: 'PiggyBank', color: 'bg-yellow-100 text-yellow-600', type: 'expense' },
  { id: 'cat-investment', name: 'Đầu tư', icon: 'TrendingUp', color: 'bg-green-100 text-green-600', type: 'expense' },
  { id: 'cat-debt', name: 'Nợ & trả góp', icon: 'CreditCard', color: 'bg-red-100 text-red-600', type: 'expense' },
  { id: 'cat-income', name: 'Thu nhập', icon: 'Wallet', color: 'bg-green-100 text-green-600', type: 'income' },
  { id: 'cat-other', name: 'Khác', icon: 'MoreHorizontal', color: 'bg-gray-100 text-gray-600', type: 'both' },
];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cat-food': ['ăn sáng', 'ăn trưa', 'ăn tối', 'cơm', 'bún', 'phở', 'bánh mì', 'hủ tiếu', 'kfc', 'mcdonald', 'lotteria', 'đồ ăn', 'nhà hàng', 'food'],
  'cat-drink': ['cafe', 'cà phê', 'trà sữa', 'highland', 'starbucks', 'phúc long', 'nước', 'đồ uống', 'bia', 'nhậu'],
  'cat-transport': ['xăng', 'đổ xăng', 'grab', 'be', 'gofjek', 'taxi', 'gửi xe', 'vé xe', 'thuê xe', 'rửa xe', 'xe khách', 'máy bay'],
  'cat-shopping': ['quần áo', 'giày dép', 'shopee', 'lazada', 'tiki', 'siêu thị', 'mua sắm', 'mỹ phẩm', 'skincare'],
  'cat-bills': ['điện', 'nước', 'internet', 'wifi', 'rác', 'báo', 'truyền hình', 'phí', 'netflix', 'spotify', 'apple', 'icloud', 'điện thoại', 'mạng'],
  'cat-health': ['thuốc', 'khám bệnh', 'bác sĩ', 'nha khoa', 'bệnh viện', 'bảo hiểm', 'gym', 'yoga'],
  'cat-income': ['lương', 'thu', 'thưởng', 'lãi', 'bán', 'tiền lương', 'freelance', 'nhận'],
};

export function classifyTransaction(description: string, amount: number): { type: "income" | "expense", categoryId: string } {
  const lowerDesc = description.toLowerCase();
  
  // Basic distinction based on natural language
  let type: "income" | "expense" = "expense";
  if (lowerDesc.includes('lương') || lowerDesc.includes('thu ') || lowerDesc.startsWith('thu ') || lowerDesc.includes('thưởng') || lowerDesc.includes('bán') || lowerDesc.includes('chuyển vào')) {
    type = "income";
  }

  let predictedCategoryId = type === 'income' ? 'cat-income' : 'cat-other';
  let maxScore = 0;

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        // Find the longest matching keyword for better accuracy
        if (keyword.length > maxScore) {
           maxScore = keyword.length;
           predictedCategoryId = catId;
        }
      }
    }
  }

  // Force type based on category
  if (predictedCategoryId === 'cat-income') {
    type = 'income';
  } else if (predictedCategoryId !== 'cat-other') {
    type = 'expense';
  }

  return { type, categoryId: predictedCategoryId };
}
