import { MigrationInterface, QueryRunner } from "typeorm";

export class BodyComposition1792172022288 implements MigrationInterface {
    name = 'BodyComposition1792172022288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "body_record" ADD "body_fat_pct" numeric(4,1)`);
        await queryRunner.query(`ALTER TABLE "body_record" ADD "skeletal_muscle_kg" numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "body_record" DROP COLUMN "skeletal_muscle_kg"`);
        await queryRunner.query(`ALTER TABLE "body_record" DROP COLUMN "body_fat_pct"`);
    }

}
