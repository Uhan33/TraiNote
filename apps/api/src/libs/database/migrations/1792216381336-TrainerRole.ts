import { MigrationInterface, QueryRunner } from "typeorm";

export class TrainerRole1792216381336 implements MigrationInterface {
    name = 'TrainerRole1792216381336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trainer" ADD "role" character varying(20) NOT NULL DEFAULT 'trainer'`);
        await queryRunner.query(`ALTER TABLE "trainer" ADD CONSTRAINT "CHK_trainer_role" CHECK ("role" IN ('trainer', 'admin'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trainer" DROP CONSTRAINT "CHK_trainer_role"`);
        await queryRunner.query(`ALTER TABLE "trainer" DROP COLUMN "role"`);
    }

}
