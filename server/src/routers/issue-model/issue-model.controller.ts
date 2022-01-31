import { Controller, Get, Param } from '@nestjs/common';
import { IssueModelService } from './issue-model.service';

@Controller('issueModel')
export class IssueModelController {
    constructor(private readonly issueModelService: IssueModelService) {}

    // 通过issueId获取某个issue的model信息
    @Get('/:issueId')
    async getIssueModelConfig(@Param('issueId') issueId:number){
        return await this.issueModelService.getModelNeedDataByIssueId(issueId)
    }
}
