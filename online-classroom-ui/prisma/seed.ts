import { PrismaClient, UserRole } from '@prisma/client' // Import Enum UserRole
import { hash } from 'bcryptjs' // Hoặc 'bcrypt' tùy thư viện bạn dùng

const prisma = new PrismaClient()

async function main() {
  // 1. Mã hóa mật khẩu
  const password = await hash('12345678', 12)

  // 2. Tạo (hoặc cập nhật) user Admin
  const admin = await prisma.user.upsert({
    where: { email: 'huynhadmin@gmail.com' },
    update: {
        role: 'admin' as UserRole, // Đảm bảo role luôn là admin
    },
    create: {
      email: 'huynhadmin@gmail.com',
      username: 'Huynh Admin',
      password: password,
      role: 'admin' as UserRole, // <--- QUAN TRỌNG NHẤT
      
      // Các trường bắt buộc khác trong schema của bạn:
      class_name: 'Phòng Đào Tạo',
      schoolname: 'Đại Học NTT',
      address: 'TP.HCM',
      birthday: new Date('2000-01-01'),
      phone: '0909000111',
      isBanned: false,
      isEmailVerified: true
    },
  })

  console.log({ admin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })