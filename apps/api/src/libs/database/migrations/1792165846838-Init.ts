import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1792165846838 implements MigrationInterface {
    name = 'Init1792165846838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "trainer" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "login_id" character varying(30) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255), "name" character varying(50) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e08bf421cb2976b17827aa6218f" UNIQUE ("login_id"), CONSTRAINT "UQ_ce2cdec7da2cbe6593e00ac502c" UNIQUE ("email"), CONSTRAINT "PK_8dfa741df6d52a0da8ad93f0c7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "member" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" character(6) NOT NULL, "trainer_id" uuid NOT NULL, "name" character varying(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "disconnected_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_87dbb39d7c7c430faa5bf1af3bb" UNIQUE ("code"), CONSTRAINT "PK_97cbbe986ce9d14ca5894fdc072" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_adc9171e5969bf2cd2191d7814" ON "member"  ("trainer_id") `);
        await queryRunner.query(`CREATE TABLE "workout_log" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "member_id" uuid NOT NULL, "log_date" date NOT NULL, "title" character varying(50) NOT NULL DEFAULT '', "memo" text NOT NULL DEFAULT '', "exercises" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fd478d1f69073979c3370ac8d76" UNIQUE ("member_id", "log_date"), CONSTRAINT "PK_71c59827176c502ae9484fe6bc3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "member" ADD CONSTRAINT "FK_adc9171e5969bf2cd2191d78147" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_log" ADD CONSTRAINT "FK_a55dc97370502900917608388b6" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_log" DROP CONSTRAINT "FK_a55dc97370502900917608388b6"`);
        await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_adc9171e5969bf2cd2191d78147"`);
        await queryRunner.query(`DROP TABLE "workout_log"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_adc9171e5969bf2cd2191d7814"`);
        await queryRunner.query(`DROP TABLE "member"`);
        await queryRunner.query(`DROP TABLE "trainer"`);
    }

}
