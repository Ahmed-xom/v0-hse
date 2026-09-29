import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { journey } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const value = (input: unknown) => input == null || input === '' ? 'N/A' : String(input)
const row = (label: string, input: unknown) => new TableRow({ children: [new TableCell({ children: [new Paragraph(label)] }), new TableCell({ children: [new Paragraph(value(input))] })] })

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const record = await db.select().from(journey).where(eq(journey.id, id)).then((rows) => rows[0])
  if (!record) return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
  const details = (record.templateDetails ?? {}) as Record<string, unknown>
  const document = new Document({ sections: [{ children: [
    new Paragraph({ text: 'Journey Summary', heading: HeadingLevel.TITLE }),
    new Table({ rows: [row('Number', record.id), row('Business Unit', details.businessUnit), row('Status', record.status), row('Created By', record.userName), row('Created At', record.createdAt)] }),
    new Paragraph({ text: 'Driver Details', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Driver Name', record.driver), row('Mobile No', details.driverMobile), row('License Number', details.driverLicenseNumber), row('Driving Expiry', details.driverExpiry), row('Second Driver Name', record.secondDriver), row('Second Driver Mobile No', details.secondDriverMobile), row('Second Driver License Number', details.secondDriverLicenseNumber), row('Second Driver License Expiry Date', details.secondDriverExpiry)] }),
    new Paragraph({ text: 'Journey', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Purpose of Journey', record.purpose), row('Journey Start Date', record.departureDate), row('Journey Start Time', record.departureTime), row('Departure Point', record.origin), row('Destination Point', record.destination), row('Round Trip', details.roundTrip)] }),
    new Paragraph({ text: 'Vehicle', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Vehicle Registration No', record.vehiclePlate), row('Vehicle Type', record.vehicleType), row('Max. Allowable Load (Ton)', details.allowableLoad), row('KM Reading', details.kmReading)] }),
    new Paragraph({ text: 'Check In Details', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Departure Journey Manager Name', details.departureManager), row('Departure Point Contact No', details.departureContact), row('Destination Journey Manager Name', details.destinationManager), row('Destination Point Contact No', details.destinationContact)] }),
    new Paragraph({ text: 'Vehicle Pre-Trip Inspection Checklist', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: Object.entries((details.inspection ?? {}) as Record<string, unknown>).map(([label, answer]) => row(label, answer)) }),
    new Paragraph({ text: 'Route Plan', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Planned Route', details.plannedRoute), row('Actual Route', details.actualRoute), row('Route Breakdown', details.routeBreakdown), row('Changes', details.routeChanges), row('Reason for Changes', details.routeChangeReason), row('Person Responsible for Changes', details.routeChangeOwner)] }),
    new Paragraph({ text: 'Night Driving Approvals', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Reason for Night Driving', details.nightDrivingReason), row('Facility or Unit Manager Approval', details.facilityApproval), row('Country Manager Approval', details.countryApproval)] }),
    new Paragraph({ text: 'Road Hazards', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Weather Condition', details.weatherHazards), row('Road Condition', details.roadHazards)] }),
    new Paragraph({ text: 'Journey Close-Out', heading: HeadingLevel.HEADING_1 }),
    new Table({ rows: [row('Actual Arrival to Destination', details.actualArrival), row('Emergency Contacts', details.emergencyContacts), row('User Comments', details.userComments), row('Driver Signature', details.driverSignature), row('Journey Manager Signature', details.journeyManagerSignature), row('STP/PIC Signature', details.stpPicSignature), row('Destination Journey Manager Signature', details.destinationManagerSignature)] }),
  ] }] })
  const buffer = await Packer.toBuffer(document)
  return new NextResponse(buffer as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="JM-Detail-${record.id}.docx"` } })
}
