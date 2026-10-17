import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberMemo1792169395967 implements MigrationInterface {
    name = 'MemberMemo1792169395967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member" ADD "memo" character varying(500) NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "memo"`);
    }

}
