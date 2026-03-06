import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const employeeExample = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Jane Smith',
  email: 'employee@techcorp.com',
  department: 'Engineering',
  role: 'middle',
  gender: 'female',
  hobbies: 'Читання, Подорожі',
  favoriteAnimal: 'Кіт',
  companyId: '65f1a2b3c4d5e6f7a8b9c0d5',
  createdAt: '2026-03-05T10:00:00.000Z',
  updatedAt: '2026-03-05T10:00:00.000Z',
};

export function ApiFindAllEmployees() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати всіх співробітників' }),
    ApiResponse({ status: 200, schema: { example: [employeeExample] } }),
  );
}

export function ApiFindOneEmployee() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати співробітника за ID' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiResponse({ status: 200, schema: { example: employeeExample } }),
  );
}

export function ApiUpdateEmployee() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Оновити дані співробітника' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiBody({
      type: UpdateEmployeeDto,
      description: 'JSON з полями для оновлення',
      schema: {
        example: {
          department: 'Architecture',
          role: 'senior',
          hobbies: 'Настільні ігри',
        },
      },
    }),
    ApiResponse({
      status: 200,
      schema: { example: { ...employeeExample, role: 'senior' } },
    }),
  );
}

export function ApiRemoveEmployee() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Видалити співробітника' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          status: 'success',
          message: 'Employee 65f1a2b3c4d5e6f7a8b9c0d1 successfully deleted',
        },
      },
    }),
  );
}
