import { MigrationInterface, QueryRunner } from "typeorm";

export class PersonalWorkout1793344255952 implements MigrationInterface {
    name = 'PersonalWorkout1793344255952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "personal_workout" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "member_id" uuid NOT NULL, "log_date" date NOT NULL, "content" text NOT NULL DEFAULT '', "exercises" jsonb NOT NULL DEFAULT '[]', "member_updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "trainer_read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d997474319f6dc271d4dc7d9a66" UNIQUE ("member_id", "log_date"), CONSTRAINT "PK_a4bfd45a1cf882b789efe5114d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "personal_workout_comment" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "personal_workout_id" uuid NOT NULL, "author" character varying(10) NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_971604ee62845d58e3229cb8e31" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3dc389ee3020d27150ee69e8cf" ON "personal_workout_comment"  ("personal_workout_id") `);
        await queryRunner.query(`ALTER TABLE "personal_workout" ADD CONSTRAINT "FK_737176726d158ba5f920bbbb4f9" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "personal_workout_comment" ADD CONSTRAINT "FK_3dc389ee3020d27150ee69e8cf1" FOREIGN KEY ("personal_workout_id") REFERENCES "personal_workout"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personal_workout_comment" DROP CONSTRAINT "FK_3dc389ee3020d27150ee69e8cf1"`);
        await queryRunner.query(`ALTER TABLE "personal_workout" DROP CONSTRAINT "FK_737176726d158ba5f920bbbb4f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3dc389ee3020d27150ee69e8cf"`);
        await queryRunner.query(`DROP TABLE "personal_workout_comment"`);
        await queryRunner.query(`DROP TABLE "personal_workout"`);
    }

}
