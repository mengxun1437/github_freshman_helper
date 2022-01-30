import { Controller, Get } from '@nestjs/common';
import { IssueService } from './issue.service';

@Controller('issue')
export class IssueController {
    constructor(private readonly issueService: IssueService) {}
    @Get('/collectFirstIssues')
    async getGoodFirstIssues():Promise<any> {
        await this.issueService.collectFirstIssues()
        return 'success'
    }
}
