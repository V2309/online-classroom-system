import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      username,
      class_name,
      schoolname,
      birthday,
      address,
      email,
      phone,
      role,
      password,
    } = body;

    // Kiểm tra các trường bắt buộc
    if (
      !username || !class_name || !schoolname ||
      !birthday || !address || !role || !password
    ) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      });
    }

    // Kiểm tra email trùng
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), {
          status: 409,
        });
      }
    }

    // Kiểm tra phone trùng
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return new Response(JSON.stringify({ error: 'Phone already in use' }), {
          status: 409,
        });
      }
    }

    // Hash mật khẩu
    const hashedPassword = await hash(password, 10);

    // Tạo user và bản ghi tương ứng (student/teacher) trong một transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Tạo user trước
      const newUser = await prisma.user.create({
        data: {
          username,
          class_name,
          schoolname,
          birthday: new Date(birthday),
          address,
          email,
          phone,
          role,
          password: hashedPassword,
        },
      });

      // Tạo bản ghi tương ứng dựa trên role
      if (role === 'student') {


        // Tạo student
        const newStudent = await prisma.student.create({
          data: {
            id: newUser.id,
            username,
            class_name,
            schoolname,
            birthday: new Date(birthday),
            address,
            email,
            phone,
            password: hashedPassword,
            userId: newUser.id,
           
          },
        });

        return { user: newUser, student: newStudent };
      } else if (role === 'teacher') {
        // Tạo teacher
        const newTeacher = await prisma.teacher.create({
          data: {
            id: newUser.id,
            username,
            class_name,
            schoolname,
            birthday: new Date(birthday),
            address,
            email,
            phone,
            password: hashedPassword,
            userId: newUser.id,
          },
        });

        return { user: newUser, teacher: newTeacher };
      }

      return { user: newUser };
    });

    return new Response(JSON.stringify(result), { status: 201 });
  } catch (err: any) {
    // Bắt lỗi Prisma unique constraint
    if (err.code === 'P2002') {
      const target = err.meta?.target?.join(', ') || 'field';
      return new Response(JSON.stringify({ error: `Duplicate ${target}` }), {
        status: 409,
      });
    }
    
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message || 'Something went wrong' }), 
      { status: 500 }
    );
  }
}