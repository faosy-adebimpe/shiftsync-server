# ShiftSync Backend

A comprehensive backend API for the ShiftSync multi-location staff scheduling platform.

## Features

- **User Management**: Role-based access (Admin, Manager, Staff)
- **Shift Scheduling**: Create, assign, and manage shifts with constraint validation
- **Real-time Updates**: WebSocket integration for live notifications
- **Location Management**: Multi-timezone support across 4 locations
- **Skill-based Assignments**: Staff certification and skill requirements
- **Overtime Tracking**: Labor law compliance and warnings
- **Shift Swapping**: Staff-initiated swap and drop requests
- **Audit Trail**: Complete logging of all schedule changes
- **Notifications**: In-app notifications with persistence

## Tech Stack

- **Node.js** with Express.js
- **SQLite** database with Sequelize ORM
- **Socket.io** for real-time features
- **JWT** for authentication
- **bcrypt** for password hashing
- **Moment.js** for timezone handling

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Navigate to the server directory:

   ```bash
   cd server
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create environment file:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Shifts

- `POST /api/shifts/locations/:locationId/shifts` - Create shift
- `GET /api/shifts/locations/:locationId/shifts` - Get shifts for location
- `GET /api/shifts/:shiftId` - Get specific shift
- `PUT /api/shifts/:shiftId` - Update shift
- `DELETE /api/shifts/:shiftId` - Delete shift
- `POST /api/shifts/:shiftId/assign` - Assign staff to shift
- `DELETE /api/shifts/:shiftId/assign/:userId` - Unassign staff
- `POST /api/shifts/locations/:locationId/publish` - Publish schedule
- `POST /api/shifts/locations/:locationId/unpublish` - Unpublish schedule

## Database Schema

The application uses the following main entities:

- **Users**: Staff, managers, and admins
- **Locations**: Restaurant locations across timezones
- **Skills**: Required competencies (Bartender, Server, etc.)
- **Shifts**: Scheduled work periods
- **ShiftAssignments**: Links between shifts and assigned staff
- **Availabilities**: Staff availability windows
- **SwapRequests**: Shift swap and drop requests
- **Notifications**: User notifications
- **AuditLogs**: Change tracking

## Seed Data

The application includes seed data with:

- 4 locations across 2 timezones
- Sample users with different roles
- Skills and certifications
- Example availability schedules

## Real-time Features

The application uses Socket.io for real-time updates:

- Live shift updates
- Instant notifications
- Real-time schedule changes
- Live staff clock-in status

## Security

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation with Joi
- CORS protection
- Helmet security headers

## Development

### Scripts

- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `DB_DIALECT` - Database type (sqlite)
- `DB_STORAGE` - SQLite database file path

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

The application is configured for deployment with:

- Environment-based configuration
- SQLite database (can be changed to PostgreSQL for production)
- PM2 process management (recommended)

## Assumptions & Decisions

### Intentional Ambiguities (as per requirements)

1. **Historical Data**: When staff are de-certified from locations, their historical shift assignments remain for audit purposes.

2. **Desired Hours**: Desired hours are used for fairness analytics but don't restrict scheduling - they're informational.

3. **Consecutive Days**: Any shift counts toward consecutive days worked, regardless of duration.

4. **Shift Edits After Approval**: If a shift is edited after swap approval but before occurrence, the swap is cancelled with notification.

5. **Timezone Boundaries**: Locations are assumed to be in single timezones. Staff working across timezone boundaries must be certified in each location separately.

## Login Credentials (Seed Data)

- **Admin**: admin@coastal.com / password123
- **Manager 1**: manager1@coastal.com / password123 (Downtown & Eastside locations)
- **Manager 2**: manager2@coastal.com / password123 (NYC location)
- **Staff 1**: staff1@coastal.com / password123
- **Staff 2**: staff2@coastal.com / password123
- **Staff 3**: staff3@coastal.com / password123

## Known Limitations

- Email notifications are simulated (in-app only)
- No file upload functionality
- Basic error handling (can be enhanced)
- No comprehensive input sanitization (relies on Sequelize)
- SQLite used for development (PostgreSQL recommended for production)

## Future Enhancements

- Email/SMS notifications
- Advanced analytics dashboard
- Mobile app API
- Integration with payroll systems
- Advanced reporting features
- Automated scheduling algorithms
