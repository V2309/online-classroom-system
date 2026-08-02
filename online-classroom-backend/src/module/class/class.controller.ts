import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  async getClasses(
    @CurrentUser() user: any,
    @Query() query: { page?: string; type?: string; search?: string },
  ) {
    return this.classService.getClasses(user.id, user.role, query);
  }
}
