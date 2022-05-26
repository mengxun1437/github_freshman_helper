import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class IssuePredict {
    @PrimaryColumn()
    modelId:string

    @Column({default:"process"})
    status:string

    @Column({default:0})
    predictNum:number

    @Column({default:0})
    process:number

    @Column({default:0})
    goodNum:number

    @Column({default:0})
    badNum:number

    @Column({default:0})
    errorNum:number
    
    @Column({type:"longtext",nullable:true})
    goodIssueIds:string

}