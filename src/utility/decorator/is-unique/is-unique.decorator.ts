// validators/is-unique.constraint.ts
import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';
import { Op } from 'sequelize';

type UniqueConstraintArgs = {
    // Lazily provide the model to avoid import cycles
    modelGetter: () => any;               // e.g. () => User
    column: string;                        // e.g. 'email' | 'user_name'
    exceptIdProp?: string;                 // e.g. 'id' (a property on the DTO)
    exceptColumn?: string;                 // column to apply the except filter on
    exceptedVale?: Array<any>;             // values to exclude from validation
    paranoid?: boolean
};

@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
    private customMessage: string | null = null;

    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        this.customMessage = null;
        if (value === null || value === undefined || value === '') return true;

        const dto: any = args.object;
        const [opts] = args.constraints as [UniqueConstraintArgs];

        // Skip validation if value is in the excepted values array
        if (opts.exceptedVale && opts.exceptedVale.includes(value.trim().replaceAll(/[^+\d]/g, ''))) {
            return true;
        }

        const Model = opts.modelGetter();
        const where: any = { [opts.column]: value };

        // exclude current record when updating (if dto[exceptIdProp] exists)
        if (opts.exceptIdProp && dto?.[opts.exceptIdProp]) {
            const exceptColumn = opts.exceptColumn ?? 'id';
            where[exceptColumn] = { [Op.not]: dto[opts.exceptIdProp] };
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call        
        const count = await Model.findOne({
            where,
            paranoid: opts.paranoid ?? false,
            attributes: Model.name === 'User' ? ['id', 'roleId'] : ['id'],
        });

        if (count) {
            if (Model.name == 'User' && opts.column == 'email') {
                this.customMessage = `This ${opts.column.replace(/_/g, ' ')} is already used by ${count.roleId == 2 ? 'patent' : 'staff'} in the system`;
                return false;
            }
        }

        return count ? false : true
    }

    defaultMessage(args: ValidationArguments): string {
        if (this.customMessage) return this.customMessage;
        const [opts] = args.constraints as [UniqueConstraintArgs];
        // Humanize the column a bit
        const label = opts.column.replace(/_/g, ' ');
        return `${label.charAt(0).toUpperCase() + label.slice(1)} already exists`;
    }
}


export function IsUnique(
    modelGetter: () => any,
    column: string,
    options?: { exceptIdProp?: string; exceptColumn?: string, exceptedVale?: Array<any>, paranoid?: boolean },
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [{
                modelGetter,
                column,
                exceptIdProp: options?.exceptIdProp,
                exceptColumn: options?.exceptColumn,
                exceptedVale: options?.exceptedVale,
                paranoid: options?.paranoid,
            }],
            validator: IsUniqueConstraint,
        });
    };
}
