import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberPt1792199642795 implements MigrationInterface {
    name = 'MemberPt1792199642795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member" ADD "pt_total" integer`);
        await queryRunner.query(`ALTER TABLE "member" ADD "pt_counted_since" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "pt_counted_since"`);
        await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "pt_total"`);
    }

}
