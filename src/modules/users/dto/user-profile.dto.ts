import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    example: '1043839293...',
    description: 'Унікальний ідентифікатор Google',
  })
  googleId: string;

  @ApiProperty({
    example: 'pavel.maluev@gmail.com',
    description: 'Електронна пошта користувача',
  })
  email: string;

  @ApiProperty({
    example: 'Павло Малуєв',
    description: "Повне ім'я",
  })
  fullName: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/ALm5wu...',
    description: 'URL-адреса фотографії профілю',
    required: false,
  })
  picture?: string;
}
