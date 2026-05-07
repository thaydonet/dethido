export function slugify(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ lại chữ, số, khoảng trắng và gạch ngang
    .trim()
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng gạch ngang
    .replace(/-+/g, '-'); // Tránh các gạch ngang liên tiếp
}
