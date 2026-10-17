import { MigrationInterface, QueryRunner } from "typeorm";

export class TrainerEmailOptional1792167456596 implements MigrationInterface {
    name = 'TrainerEmailOptional1792167456596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trainer" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trainer" ALTER COLUMN "email" SET NOT NULL`);
    }

}
