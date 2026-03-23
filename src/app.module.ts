import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeesModule } from './modules/employees/employee.module';
import { AiModule } from './modules/ai/ai.module';
import { CompaniesModule } from './modules/companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    AiModule,
    AuthModule,
    EmployeesModule,
    CompaniesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
