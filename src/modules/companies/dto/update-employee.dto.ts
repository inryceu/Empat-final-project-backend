import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInviteDto } from './create-invite.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateInviteDto, ['name'] as const),
) {}
