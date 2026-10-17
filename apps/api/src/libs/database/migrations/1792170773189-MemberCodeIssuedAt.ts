import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberCodeIssuedAt1792170773189 implements MigrationInterface {
    name = 'MemberCodeIssuedAt1792170773189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member" ADD "code_issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "code_issued_at"`);
    }

}
