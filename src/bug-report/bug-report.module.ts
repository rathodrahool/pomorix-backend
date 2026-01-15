import { Module } from '@nestjs/common';
import { BugReportService } from './bug-report.service';
import { BugReportController } from './bug-report.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BugReportController],
    providers: [BugReportService],
})
export class BugReportModule { }
