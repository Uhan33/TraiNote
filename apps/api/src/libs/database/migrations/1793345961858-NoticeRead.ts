import { MigrationInterface, QueryRunner } from "typeorm";

export class NoticeRead1793345961858 implements MigrationInterface {
    name = 'NoticeRead1793345961858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notice_read" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "notice_id" uuid NOT NULL, "trainer_id" uuid, "member_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b772d812ab4f9aba55a538dd029" UNIQUE ("notice_id", "member_id"), CONSTRAINT "UQ_6889969ecb9e3493813669ab7bb" UNIQUE ("notice_id", "trainer_id"), CONSTRAINT "PK_b2387591bff7ac2bbb57935ea75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notice_read" ADD CONSTRAINT "FK_0e1fb9747c7146e27f353533635" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notice_read" ADD CONSTRAINT "FK_3b7910eabd9ceb1ce97e30ae27d" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notice_read" ADD CONSTRAINT "FK_dcd8741838a2bda84421622a221" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notice_read" DROP CONSTRAINT "FK_dcd8741838a2bda84421622a221"`);
        await queryRunner.query(`ALTER TABLE "notice_read" DROP CONSTRAINT "FK_3b7910eabd9ceb1ce97e30ae27d"`);
        await queryRunner.query(`ALTER TABLE "notice_read" DROP CONSTRAINT "FK_0e1fb9747c7146e27f353533635"`);
        await queryRunner.query(`DROP TABLE "notice_read"`);
    }

}
