import { MigrationInterface, QueryRunner } from "typeorm";

export class BodyRecord1792171666832 implements MigrationInterface {
    name = 'BodyRecord1792171666832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "body_record" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "member_id" uuid NOT NULL, "record_date" date NOT NULL, "weight_kg" numeric(5,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_19a88782321ff1437ee926b8bd6" UNIQUE ("member_id", "record_date"), CONSTRAINT "PK_cb85a6b88bfdedf0542de3133b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "body_record" ADD CONSTRAINT "FK_b6efff3efd1649c1006dc23cb9c" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "body_record" DROP CONSTRAINT "FK_b6efff3efd1649c1006dc23cb9c"`);
        await queryRunner.query(`DROP TABLE "body_record"`);
    }

}
