import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshToken1792166940664 implements MigrationInterface {
    name = 'RefreshToken1792166940664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "trainer_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f0812282fad2e352cdaf83ef0a9" UNIQUE ("token_hash"), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d9c6b67daacd0da93ee084fb64" ON "refresh_token"  ("trainer_id") `);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_d9c6b67daacd0da93ee084fb648" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_d9c6b67daacd0da93ee084fb648"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9c6b67daacd0da93ee084fb64"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
    }

}
