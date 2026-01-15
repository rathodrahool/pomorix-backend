import { Injectable } from '@nestjs/common';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BugReportService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string | null, dto: CreateBugReportDto) {
        const result = await this.prisma.bug_reports.create({
            data: {
                user_id: userId,
                title: dto.title,
                description: dto.description,
            },
        });
        return { id: result.id };
    }
}
