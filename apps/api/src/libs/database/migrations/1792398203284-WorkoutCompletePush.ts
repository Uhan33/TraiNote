import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkoutCompletePush1792398203284 implements MigrationInterface {
    name = 'WorkoutCompletePush1792398203284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "push_subscription" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "member_id" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh" character varying(200) NOT NULL, "auth" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_27ae9074fc39a09bc1aee263df5" UNIQUE ("endpoint"), CONSTRAINT "PK_07fc861c0d2c38c1b830fb9cb5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "workout_log" ADD "completed_at" TIMESTAMP WITH TIME ZONE`);
        // 기존 일지는 모두 작성 완료로 — 회원 화면에 계속 보이게 (알림은 보내지 않음)
        await queryRunner.query(`UPDATE "workout_log" SET "completed_at" = "updated_at"`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD CONSTRAINT "FK_ff44eb6914a05870cb1407ec2d5" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP CONSTRAINT "FK_ff44eb6914a05870cb1407ec2d5"`);
        await queryRunner.query(`ALTER TABLE "workout_log" DROP COLUMN "completed_at"`);
        await queryRunner.query(`DROP TABLE "push_subscription"`);
    }

}
