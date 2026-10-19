import { MigrationInterface, QueryRunner } from "typeorm";

export class TrainerPushSubscription1792400149380 implements MigrationInterface {
    name = 'TrainerPushSubscription1792400149380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "trainer_push_subscription" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "trainer_id" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh" character varying(200) NOT NULL, "auth" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_06ae960ec98e8f33dcac6634117" UNIQUE ("endpoint"), CONSTRAINT "PK_8263c58565b4f77c8b84ddcf5bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "trainer_push_subscription" ADD CONSTRAINT "FK_055580d94a0163149a8c4e00e0f" FOREIGN KEY ("trainer_id") REFERENCES "trainer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trainer_push_subscription" DROP CONSTRAINT "FK_055580d94a0163149a8c4e00e0f"`);
        await queryRunner.query(`DROP TABLE "trainer_push_subscription"`);
    }

}
