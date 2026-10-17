import { MigrationInterface, QueryRunner } from "typeorm";

export class Inquiry1792208034475 implements MigrationInterface {
    name = 'Inquiry1792208034475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inquiry" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "trainer_id" uuid NOT NULL, "category" character varying(20) NOT NULL, "title" character varying(100) NOT NULL, "content" text NOT NULL, "contact" character varying(100) NOT NULL DEFAULT '', "user_agent" character varying(300) NOT NULL DEFAULT '', "app_version" character varying(20) NOT NULL DEFAULT '', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3e226d0994e8bd24252dd65e1b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inquiry" ADD CONSTRAINT "FK_106dd7ee9ca85724c9a1593cd38" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inquiry" DROP CONSTRAINT "FK_106dd7ee9ca85724c9a1593cd38"`);
        await queryRunner.query(`DROP TABLE "inquiry"`);
    }

}
