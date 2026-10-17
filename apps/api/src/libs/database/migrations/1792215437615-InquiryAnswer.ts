import { MigrationInterface, QueryRunner } from "typeorm";

export class InquiryAnswer1792215437615 implements MigrationInterface {
    name = 'InquiryAnswer1792215437615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inquiry" ADD "answer" text`);
        await queryRunner.query(`ALTER TABLE "inquiry" ADD "answered_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inquiry" DROP COLUMN "answered_at"`);
        await queryRunner.query(`ALTER TABLE "inquiry" DROP COLUMN "answer"`);
    }

}
