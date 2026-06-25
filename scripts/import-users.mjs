/**
 * One-time user import script.
 * Upserts 265 users from the exported CSV into:
 *   neon_auth.user   — id (uuid), name, email, role, banned, createdAt, updatedAt
 *   public.employee  — email, name, payroll_no, designation, business_unit, hse_role
 *
 * Run:  node --env-file-if-exists=/vercel/share/.env.project scripts/import-users.mjs
 */

import pg from 'pg'
import { randomUUID } from 'crypto'

const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// CSV data (all 265 rows)
// Format: [name, email, role, status, businessUnit, designation, payrollNo, createdDate]
const users = [
  ["Ahmed Abdalhamid Abbady","aabbady@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","XOM-DS-CON-0011","2026-06-20T09:06:48.264Z"],
  ["Ahmed AB","2@xomoman.com","MANAGEMENT","Inactive","XOM Drilling System","Managing Director","XDS-DS--014","2026-06-20T09:06:48.264Z"],
  ["xom xom xom (S)","xom23@xomoman.com","USER","Active","Falcon Oilfield Services","Technical Director","1224","2026-06-20T09:06:48.264Z"],
  ["lmwdq kqnef ewqf (S)","1@xomoman.com","USER","Active","Falcon Oilfield Services","Delivery Assurance Assistant Manager","2ejd","2026-06-20T09:06:48.264Z"],
  ["Ahmed Mohammed AL-Habsi","ahabsi@falconofs.com","USER","Inactive","Falcon Oilfield Services","Store Man & Journey Manager","L-NSE-0281","2026-06-20T09:06:48.264Z"],
  ["Ib Hi Al (S)","xom@xomoman.com","USER","Inactive","XOM Oman","Electrician","L-XOM-0043","2026-06-20T09:06:48.264Z"],
  ["q293 dwd (S)","xom1@xomoman.com","USER","Inactive","Falcon Oilfield Services","Assistant WL Operator","i","2026-06-20T09:06:48.264Z"],
  ["Ahmed Mohammed Osama Ahmed","aosama@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","E-FDS-0036","2026-06-20T09:06:48.264Z"],
  ["Ahmed Khalid Ahmed Al Zakwani","aalzakwani@xomoman.com","USER - JM","Active","XOM Drilling System","Journey manager / store keeper","L-XOM-0052","2026-06-20T09:06:48.264Z"],
  ["IT Admin XOM","xom-it-admin@xomoman.com","ADMIN SYSTEM","Active","XOM Oman","System Administrator","L-328543","2026-06-20T09:06:48.264Z"],
  ["Syed Sadaqat Approver","syedsadaqat2494326@gmail.com","MASTER USER","Active","Falcon Oilfield Services","HSE Manager","Approver","2026-06-20T09:06:48.264Z"],
  ["Rustam Khasanshin","rkhasanshin@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","430974","2026-06-20T09:06:48.264Z"],
  ["Shaker Al Kathiri","skathiri@xomoman.com","USER","Active","XOM Drilling System","Directional Driller Trainee","L-XDS-0055","2026-06-20T09:06:48.264Z"],
  ["Yousuf Mohsen Al-Hashmi","yalhashmi@xomoman.com","USER","Active","XOM Drilling System","MWD Trainee","L-XOM-0024","2026-06-20T09:06:48.264Z"],
  ["Ibrahim Hilal Albusaidi (S)","ibusaidi@xomoman.com","USER","Active","XOM Oman","General Manager","L-XOM-0040","2026-06-20T09:06:48.264Z"],
  ["Mohammed Hilal Ahmed AlKindi","m.alkindi@falconofs.com","USER - JM","Active","Falcon Oilfield Services","Workshop Supervisor","L-NSE-0286","2026-06-20T09:06:48.264Z"],
  ["Sameh Salim AlHarthy","sharthy@falconofs.com","USER","Inactive","Falcon Oilfield Services","Payroll Officer","NSE-0285","2026-06-20T09:06:48.264Z"],
  ["Laila Ahmed AlKindi","lkindi@falconofs.com","HR","Active","Falcon Oilfield Services","Admin and HR","L-NSE-0284","2026-06-20T09:06:48.264Z"],
  ["Jabir Mohammed AlMahrouqi","jmahrouqi@falconofs.com","USER","Active","Falcon Oilfield Services","Base Manager","L-NSE-0283","2026-06-20T09:06:48.264Z"],
  ["Mohammed Sulaiman Hassan Al-Balushi","mbalushi@falconstaff.org","USER","Active","Falcon Oilfield Services","TCP Operator","L-NSE-0282","2026-06-20T09:06:48.264Z"],
  ["Shihab Hamad Mubarak Al-Abri","salabri@falconofs.com","MANAGEMENT","Active","Falcon Oilfield Services","Field Engineer","L-NSE-0280","2026-06-20T09:06:48.264Z"],
  ["Tariq Salim Said Al-Kalbani","tkalbani@falconofs.com","MANAGEMENT","Active","Falcon Oilfield Services","Base Supervisor","L-NSE-0279","2026-06-20T09:06:48.264Z"],
  ["Abdul Rahim Saif Ahmed Al-Kindi","a.kindi@falconofs.com","SITE MANAGER","Active","Falcon Oilfield Services","Base Supervisor","L-NSE-0278","2026-06-20T09:06:48.264Z"],
  ["Hamed Hamood Said Al-Busaidi","hbusaidi@falconstaff.org","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0277","2026-06-20T09:06:48.264Z"],
  ["Ali Rashid Moahmmed Al-Sawafi","asawafi@falconstaff.org","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0274","2026-06-20T09:06:48.264Z"],
  ["Juma Khalid Al-Sabari","jsabri@falconofs.com","USER","Active","Falcon Oilfield Services","TCP Engineer","L-NSE-0272","2026-06-20T09:06:48.264Z"],
  ["Anwar Saif Abdullah Al-KhayarI","akhayari@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","L-NSE-0271","2026-06-20T09:06:48.264Z"],
  ["Salim Hamood Salim Al-Shekaili","s.alshekaili@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","L-NSE-0270","2026-06-20T09:06:48.264Z"],
  ["Sharifa Ahmed Al-Sawwafi","ssawwafi@falconofs.com","USER","Active","Falcon Oilfield Services","Accountant","L-NSE-0266","2026-06-20T09:06:48.264Z"],
  ["Idris Hamid Al-Mayahi","imayahi@falconofs.com","USER","Active","Falcon Oilfield Services","Field Engineer","L-NSE-0262","2026-06-20T09:06:48.264Z"],
  ["Nasser Hamoud Al-Burtamani","nburtamani@falconofs.com","USER","Active","Falcon Oilfield Services","TCP Engineer","L-NSE-0261","2026-06-20T09:06:48.264Z"],
  ["Huda Salim Sulaiman AlJahwari","hjahwari@falconstaff.org","USER","Active","Falcon Oilfield Services","HSE Supervisor","L-NSE-0248","2026-06-20T09:06:48.264Z"],
  ["Hamood Hamed AlKhusaibi","hkusaibi@falconstaff.org","USER","Inactive","Falcon Oilfield Services","Crew Chief","NSE-0256","2026-06-20T09:06:48.264Z"],
  ["Samira Hamed Al Shukaili","sam.shukaili@falconofs.com","USER","Active","Falcon Oilfield Services","Supply Chain Leader","L-NSE-0","2026-06-20T09:06:48.264Z"],
  ["Faisal Ishaqi","f.alishaqi@falconofs.com","USER","Active","Falcon Oilfield Services","Finance manager","7804967","2026-06-20T09:06:48.264Z"],
  ["Ibrahim Breiki","ibreiki@falconofs.com","MANAGEMENT","Inactive","Falcon Oilfield Services","Operations Manager","LNSE0269","2026-06-20T09:06:48.264Z"],
  ["MAZIN Salim Yahya AL AZWANI","mazwani@xomoman.com","USER","Active","XOM Drilling System","MWD Trainee","L-XDS-0050","2026-06-20T09:06:48.264Z"],
  ["Zeeshan Qamar","zeeshan@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","E-NSE-0222","2026-06-20T09:06:48.264Z"],
  ["yusral Bin Jamuir Sunur","ysunur@falconstaff.org","USER","Active","Falcon Oilfield Services","Sonde Technician","E-NSE-0217","2026-06-20T09:06:48.264Z"],
  ["Waleed Mohammed Al Alawi","walawi@falconofs.com","USER","Active","Falcon Oilfield Services","Mukaizna Field Engineer","L-HIR-0046","2026-06-20T09:06:48.264Z"],
  ["Tamer Mohammed Farghaly","t.farghaly@falconstaff.org","USER","Active","Falcon Oilfield Services","PCE Specialist","E-NSE-0226","2026-06-20T09:06:48.264Z"],
  ["Muzna Mahfoodh Al Hadi","mhadi@xomoman.com","HR","Active","XOM Drilling System","Admin and HR","Tra001-XOM","2026-06-20T09:06:48.264Z"],
  ["Muhammad Zeeshan Qadir","mqadir@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","E-HIR-0076","2026-06-20T09:06:48.264Z"],
  ["Mohammed Juma Al Rabaani","mrabaani@falconofs.com","USER","Active","Falcon Oilfield Services","Maintenance Engineer","L-HIR-0044","2026-06-20T09:06:48.264Z"],
  ["Ishaq Ali Al Afeefi","fofs-nz-elfm@falconofs.com","USER","Active","Falcon Oilfield Services","Workshop Foremen","L-NSE-0110","2026-06-20T09:06:48.264Z"],
  ["Hamed Yaqoob Al Yahyai","hyahyai@falconstaff.org","USER","Active","Falcon Oilfield Services","Mukaizna Field Engineer","L-HIR-0041","2026-06-20T09:06:48.264Z"],
  ["Hamed Saif Al Shukaili","hshekaili@falconofs.com","USER","Active","Falcon Oilfield Services","Field Operator","L-HIR-0039","2026-06-20T09:06:48.264Z"],
  ["Bati Al yaqoubi","bjuma@falconstaff.org","USER","Active","Falcon Oilfield Services","Mechanic","L-HIRC-0001","2026-06-20T09:06:48.264Z"],
  ["Asad Saed Al-Rumaidhi","aalrumaidhi@xomoman.com","USER","Active","XOM Drilling System","Electronics Technician","L-FDS-0026","2026-06-20T09:06:48.264Z"],
  ["Ali Mabrook Al Tobi","alitobi@falconstaff.org","USER","Active","Falcon Oilfield Services","PCE Specialist","L-HIRC-0002","2026-06-20T09:06:48.264Z"],
  ["Abdullah Khamis Al-Hinai","ahinai@xomoman.com","USER","Active","XOM Drilling System","Motor Technician","L-FDS-0019","2026-06-20T09:06:48.264Z"],
  ["Mounir Nessal","mnessal@xomoman.com","HSE ADMIN","Active","XOM Drilling System","Operations Manager","E-XDS-0053","2026-06-20T09:06:48.264Z"],
  ["Khalid Said Al Hothaly","khudhaili@falconofs.com","USER","Active","Falcon Oilfield Services","Mukaizna Field Engineer","L-HIR-0042","2026-06-20T09:06:48.264Z"],
  ["Adil AL-Shukaili","ashukili@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer (Trainee)","L-FINT-00017","2026-06-20T09:06:48.264Z"],
  ["Sanaullah PIR Muhammad Khan","sanaullahkh12374@gmail.com","USER","Active","XOM Drilling System","Helper","XOM-DS-SUB-001","2026-06-20T09:06:48.264Z"],
  ["Muddathir Al Fahdi","malfahdi@xomoman.com","USER","Active","XOM Drilling System","Tool Technician","L-XOMT-0037","2026-06-20T09:06:48.264Z"],
  ["Mazin Abdullah Al Kindi","malkindi@xomoman.com","USER","Active","XOM Drilling System","Electronics Technician","XOM-DS-CON-002","2026-06-20T09:06:48.264Z"],
  ["Humaid Al Waili","hwaili@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","XOM-DS-CON-012","2026-06-20T09:06:48.264Z"],
  ["Al Azhar Al Anbori","humaid1979s@icloud.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","XOM-DS-CON-013","2026-06-20T09:06:48.264Z"],
  ["Ahmed Al Khamisi","akhamisi@xomoman.com","USER - JM","Active","XOM Drilling System","Journey manager / store keeper","L-XOMT-0015","2026-06-20T09:06:48.264Z"],
  ["I H Al (S)","i@xomoman.com","USER","Active","XOM Oman","General Manager","L-XOM-0042","2026-06-20T09:06:48.264Z"],
  ["Shaker Al Kathiri","skathiri@xon.com","USER","Inactive","XOM Drilling System","Directional Drilling Engineer","22440026","2026-06-20T09:06:48.264Z"],
  ["AbdelRahman Gamal","agamal@xomoman.com","SITE MANAGER","Active","XOM Drilling System","Reliability Engineer","XOM-DS-CON-004","2026-06-20T09:06:48.264Z"],
  ["Syed Sadaqat HSEM","ssadaqat@falconofs.com","SITE MANAGER - Global","Active","Falcon Oilfield Services","QHSE Manager","FOFS-2025-01","2026-06-20T09:06:48.264Z"],
  ["Turki Al Kharusi","tkharusi@xomoman.com","USER","Inactive","XOM Drilling System","Measurement & Logging While Drilling Engineer","L-FINT-00038","2026-06-20T09:06:48.264Z"],
  ["Salim Saif Al-Abri","sabri@xomoman.com","USER","Inactive","XOM Drilling System","Measurement & Logging While Drilling Engineer","FDS-Consultant","2026-06-20T09:06:48.264Z"],
  ["Omar Khalfan Al-Amri","oaamri@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","L-FINT-00022","2026-06-20T09:06:48.264Z"],
  ["Mahmood Mohammed Mustafa Najjar","mnajjar@xomoman.com","USER","Inactive","XOM Drilling System","Measurement & Logging While Drilling Engineer","L-FDS-0046","2026-06-20T09:06:48.264Z"],
  ["Liyth Ambusaidi","lambusaidi@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","L-FINT-00020","2026-06-20T09:06:48.265Z"],
  ["Abdullah Sulaiman Hamdan Al Aamri","aamri@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","L-FDS-0043","2026-06-20T09:06:48.265Z"],
  ["Ahmed Hamed Al JUFAILI","ajufaily@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0056","2026-06-20T09:06:48.265Z"],
  ["Abdullah Sulaiman Al-Aamri","aamri@gmail.com","USER","Inactive","XOM Drilling System","Directional Driller Trainee","L-FDS-0032","2026-06-20T09:06:48.265Z"],
  ["Ahmed Khalid Ahmed Al Zakwani","azakwani@xomoman.com","USER - JM","Inactive","XOM Drilling System","Field Operator","XOM-DS-C-006","2026-06-20T09:06:48.265Z"],
  ["Hashim Ali Mubarak Al Farsi","hfarsi@xomoman.com","SITE MANAGER","Active","XOM Drilling System","Service Quality","XOM-DS-031","2026-06-20T09:06:48.265Z"],
  ["Sohail Khan Jadoon","sjadoon@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","E-NSE-0228","2026-06-20T09:06:48.265Z"],
  ["Suhail Mohammed","suhail.mohammed@barikgroup.com","USER","Active","XOM Well Maintenance","3rd Party Contractor","XWM-SUB-004","2026-06-20T09:06:48.265Z"],
  ["BASIM Ghasi AL Rahbi","b.rahbi@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer (Trainee)","L-FINT-00019","2026-06-20T09:06:48.265Z"],
  ["Asad Said AL-Yahyaai","a.yayaai@falconstaff.org","USER","Inactive","Falcon Oilfield Services","Field Engineer (Trainee)","L-FINT-00018","2026-06-20T09:06:48.265Z"],
  ["Mohammed Hamed Ali Al Shaaili","mohd95516054@gmail.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0119","2026-06-20T09:06:48.265Z"],
  ["Faisal Said Khalfan Al Harthy","faisalg3588455@gmail.com","USER","Active","XOM Well Maintenance","WHM Operator","BARIK-XWM-002","2026-06-20T09:06:48.265Z"],
  ["Fahad Majiid","fahadhpam@gmail.com","USER","Active","XOM Well Maintenance","WHM Operator","BARIK-XWM-003","2026-06-20T09:06:48.265Z"],
  ["Nasser Al Mamari","nasser88almamari@gmail.com","USER","Active","XOM Well Maintenance","WHM Operator","BARIK-XWM-01","2026-06-20T09:06:48.265Z"],
  ["Montasar Ahmed Rashid Al-Habsi","mun9911@icloud.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0127","2026-06-20T09:06:48.265Z"],
  ["Islam Mohamad Gaber","islam.gaber@falconofs.com","USER","Active","Falcon Oilfield Services","Field Engineer","E-NSE-0221","2026-06-20T09:06:48.265Z"],
  ["Hammad Shoukat","mhammad@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","E-NSE-0224","2026-06-20T09:06:48.265Z"],
  ["AL-Zaina Zayid AL-Rujaibi","a.rujaibi@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer (Trainee)","L-FINT-00039","2026-06-20T09:06:48.265Z"],
  ["Akhilesh Chopra","akhilesh@falconstaff.org","USER","Inactive","Falcon Oilfield Services","Field Engineer","E-NSE-0229","2026-06-20T09:06:48.265Z"],
  ["Fahad Hamad Ghalib","fhamed@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","E-NSE-0225","2026-06-20T09:06:48.265Z"],
  ["Ahmed Said Al-Kabi","xwm-admin-sr@xomoman.com","HR","Active","XOM Well Maintenance","Operations Support","L-FINT-0003","2026-06-20T09:06:48.265Z"],
  ["Mohammed Saif Al Busaidi","mbusaidi@xomoman.com","MANAGEMENT","Active","XOM LLC","Supply Chain & Administration Manager","XOM-0056","2026-06-20T09:06:48.265Z"],
  ["Sajid Majid","sajid.majeed@barikgroup.com","USER","Active","XOM Well Maintenance","Operations Support","FAL-FWM-SUB-003","2026-06-20T09:06:48.265Z"],
  ["Praveen Kumar","qhse02.bg@barikgroup.com","USER","Active","XOM Well Maintenance","HSE Supervisor","FAL-FWM-SUB-002","2026-06-20T09:06:48.265Z"],
  ["Harish VC","harish.vc@barikgroup.com","USER","Active","XOM Well Maintenance","Operations Support","FAL-FWM-SUB-001","2026-06-20T09:06:48.265Z"],
  ["Abdallah Ali Mohammed Al Busaidy","abusaidi@xomoman.com","USER","Active","XOM Well Maintenance","HSE Supervisor","L-FWM-0049","2026-06-20T09:06:48.265Z"],
  ["Ahmed Al Kaabi","a.alkaabi@falconstaff.org","HR","Inactive","XOM Well Maintenance","Admin and HR","L-FINT003","2026-06-20T09:06:48.265Z"],
  ["Waqas Ahmed","awaqas@falconstaff.org","USER","Active","Falcon Oilfield Services","Field Engineer","E-NSE-0216","2026-06-20T09:06:48.265Z"],
  ["Aziza Said Al Bimany","abimani@falconofs.com","HR","Inactive","XOM LLC","Administrator Assistant","E-FIN-0043","2026-06-20T09:06:48.265Z"],
  ["Sabra Saud AL-Tiwaniy","falcon.hr@falconstaff.org","HR","Active","XOM LLC","Admin and HR","LFINT00025","2026-06-20T09:06:48.265Z"],
  ["Ali Nemati","anemati@falconofs.com","SITE MANAGER","Inactive","XOM Oman","supply chain officer","E-FIN-0045","2026-06-20T09:06:48.265Z"],
  ["Ali Salim Al Aisri","alimatata88@hotmail.com","USER","Active","Falcon Oilfield Services","Senior Field Operator","L-HIR-0060","2026-06-20T09:06:48.265Z"],
  ["Musaab Mubarak Al Musheifri","mr.musaab1986@gmail.com","USER","Active","Falcon Oilfield Services","Senior Field Operator","L-HIR-0055","2026-06-20T09:06:48.265Z"],
  ["Said Masoud Al Khusaibi","skhusaibi@falconinvs.com","SITE MANAGER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0036","2026-06-20T09:06:48.265Z"],
  ["Arwa Nasser AL-Habsi","anasser@xomoman.com","HSE ADMIN","Active","XOM Oman","HSE Advisor","L-XOM-0049","2026-06-20T09:06:48.265Z"],
  ["Ahmed Badar Al Jabri","ahmedaljabri@falconstaff.org","HSE","Inactive","Falcon Oilfield Services","HSE Advisor","L-HIR-0114","2026-06-20T09:06:48.265Z"],
  ["Abdullah Saleh Al Farqani","mkn-workshop@falconofs.com","USER","Active","Falcon Oilfield Services","Mukaizna Workshop Supervisor","L-HIR-0051","2026-06-20T09:06:48.265Z"],
  ["Mohammed Abdullah Salim Al Naamani","mnaamani@falconofs.com","USER","Active","XOM Well Maintenance","WL Field Supervisor","L-FWM-0075","2026-06-20T09:06:48.265Z"],
  ["Khalid Said Al Abri","kabri@falconofs.com","USER","Active","Falcon Oilfield Services","Watchman","L-NSE-0025","2026-06-20T09:06:48.265Z"],
  ["Ali Mansoor Al Toubi","atoubi@falconofs.com","USER","Active","Falcon Oilfield Services","Watchman","L-NSE-0002","2026-06-20T09:06:48.265Z"],
  ["Mohammed Saleh Saif Al Zakwani","fwm-sr-pce@falconofs.com","USER","Active","XOM Well Maintenance","Tool Technician","L-FWM-0076","2026-06-20T09:06:48.265Z"],
  ["Fouad Ibrahim","fibrahim@falconofs.com","MANAGEMENT","Active","Falcon Oilfield Services","Technical Director","E-SHE-0001","2026-06-20T09:06:48.265Z"],
  ["Safa Mohammed Al Shukaili","sshukaili@falconofs.com","USER","Active","Falcon Oilfield Services","supply chain officer","L-FIN-0035","2026-06-20T09:06:48.265Z"],
  ["Sami Sulaiman Nasser Al Salehi","samissn20005@gmail.com","USER","Active","XOM Well Maintenance","Slickline Trainee Operator","L-FWM-0084","2026-06-20T09:06:48.265Z"],
  ["Saif Salim Al-Habsi","srashdi@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Operator","L-FWM-0122","2026-06-20T09:06:48.265Z"],
  ["Said Hamed Said Al Dhawi","sdhawi@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Operator","L-FWM-0011","2026-06-20T09:06:48.265Z"],
  ["Mohammed Salim Sultan Al Hashmi","mhashmi@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Operator","L-FWM-0115","2026-06-20T09:06:48.265Z"],
  ["Imran Khan","ikhan@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Senior Operator","E-FWM-0099","2026-06-20T09:06:48.265Z"],
  ["Brahim Ben Mansour","bbrahim@falconofs.com","USER","Inactive","XOM Well Maintenance","Slickline Operator","E-HIR-0099","2026-06-20T09:06:48.265Z"],
  ["Ahmed Alyan Raffie Mohammed","amohammed@falconofs.com","USER","Inactive","XOM Well Maintenance","Slickline Operator","E-HIR-0096","2026-06-20T09:06:48.265Z"],
  ["Abdulelah Hezam Masood Al Dhubhani","adhubhani@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Senior Operator","E-FWM-0098","2026-06-20T09:06:48.265Z"],
  ["Abderrahman Aouarib","aaouarib@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Operator","E-HIR-0098","2026-06-20T09:06:48.265Z"],
  ["Sayed Kamal","sawad@falconofs.com","USER","Active","Falcon Oilfield Services","Senior Sales Consultant","E-NSE-0003","2026-06-20T09:06:48.265Z"],
  ["Muhammad Sohrab","msohrab@falconofs.com","USER","Active","Falcon Oilfield Services","Senior Sales Consultant","E-HIR-0068","2026-06-20T09:06:48.265Z"],
  ["Oussama Mohamed Shrebati","oshrebati@falconofs.com","SITE MANAGER","Active","Falcon Oilfield Services","Sales & Technical Manager","E-NSE-0052","2026-06-20T09:06:48.265Z"],
  ["Abdul aziz Sultan Al Farsi","afarsi@xomoman.com","SITE MANAGER","Inactive","XOM Drilling System","Sales & Marketing Manager","L-FIN-0031","2026-06-20T09:06:48.265Z"],
  ["Ammar Said Al Azwani","aazwani@falconofs.com","USER","Active","Falcon Oilfield Services","Workshop Admin Assistant","L-NSE-0118","2026-06-20T09:06:48.265Z"],
  ["Saheed Tayo Oseni","soseni@xomoman.com","MASTER USER","Active","XOM Oman","QHSE Manager","E-FIN-0033","2026-06-20T09:06:48.265Z"],
  ["Hamed Amur Al Hajri","hhajri@falconofs.com","USER","Active","Falcon Oilfield Services","Public Relation Officer","L-FIN-0007","2026-06-20T09:06:48.265Z"],
  ["Huda Rashid Al Harthi","huda.alharthi@falconofs.com","USER","Active","XOM LLC","Personal Assistant","L-FIN-0027","2026-06-20T09:06:48.265Z"],
  ["Ian Jude Gonsalves","igonsalves@falconofs.com","USER","Inactive","Falcon Oilfield Services","Operator Trainer","E-HIR-0089","2026-06-20T09:06:48.265Z"],
  ["Bruce Alexander Dsouza","bdsouza@falconofs.com","USER","Active","Falcon Oilfield Services","Operator Trainer","E-HIR-0008","2026-06-20T09:06:48.265Z"],
  ["Ruqaiya Abdul Rahman AlAbri","rabri@falconinvs.com","USER","Active","XOM Drilling System","Operations Support","L-FDS-0018","2026-06-20T09:06:48.265Z"],
  ["Emad Abdel Monem Rashad","ezaki@falconofs.com","SITE MANAGER","Active","Falcon Oilfield Services","Operations Manager","E-HIR-0120","2026-06-20T09:06:48.265Z"],
  ["Zahir Said Hamed Al Touqi","ztouqi@falconofs.com","USER","Active","XOM Well Maintenance","Senior NCP Field Supervisor","L-FWM-0016","2026-06-20T09:06:48.265Z"],
  ["Waleed Saleem Thaleth Al Omairi","walomairi4@gmail.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0112","2026-06-20T09:06:48.265Z"],
  ["Said Abdullah Ali Al Mahrouqi","smahrouqi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0079","2026-06-20T09:06:48.265Z"],
  ["Salim Saif Rashid Al Jassasi","sjassasi@falconofs.com","USER","Active","XOM Well Maintenance","Senior NCP Field Supervisor","L-FWM-0038","2026-06-20T09:06:48.265Z"],
  ["Khalfan Sulaiman Hamed Al Shuaili","khalfan4321@gmail.com","USER","Active","XOM Well Maintenance","Base Manager","L-FWM-0114","2026-06-20T09:06:48.265Z"],
  ["Khalid Nasser Salim Al Hakmani","khakmani@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0072","2026-06-20T09:06:48.265Z"],
  ["Khanafour Said Hamed Al Dari","kdarai@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0073","2026-06-20T09:06:48.265Z"],
  ["Ismail Salim Ali Al Mani","imani@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0030","2026-06-20T09:06:48.265Z"],
  ["Ibrahim Mohamed Saif Al Hudaifi","ihadaifi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0070","2026-06-20T09:06:48.265Z"],
  ["Hamed Al Saghir Humaid Al Maharbi","hmaharbi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0025","2026-06-20T09:06:48.265Z"],
  ["Abdullah Saleh Ali Al Yahyaee","ayahyaee@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0051","2026-06-20T09:06:48.265Z"],
  ["Ahmed Rabia Obaid Al Rawahi","arawahi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0020","2026-06-20T09:06:48.265Z"],
  ["Ali Mohamed Murad Al Bulushi","ambalushi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Supervisor","L-FWM-0058","2026-06-20T09:06:48.265Z"],
  ["Yasser Saif Mohammed Al Majarafi","ymajarafi@falconofs.com","USER","Inactive","XOM Well Maintenance","NCP Operator","L-FWM-0045","2026-06-20T09:06:48.265Z"],
  ["Saif Ali Said Al Shamli","sshamli@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0081","2026-06-20T09:06:48.265Z"],
  ["Sultan Mohammed Hamood Al Gaithi","sghaithi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0043","2026-06-20T09:06:48.265Z"],
  ["Salim Obaid Mohammed Al Durey","sdurei@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0082","2026-06-20T09:06:48.265Z"],
  ["Salim Said Mohammed Al Burtamani","sburtamani@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0083","2026-06-20T09:06:48.265Z"],
  ["Mohammed Ahmed Said Al Rawahi","mrawahi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0018","2026-06-20T09:06:48.265Z"],
  ["Hamed Sulaiman Said Al Raqami","hraqami@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0065","2026-06-20T09:06:48.265Z"],
  ["Hashil Humaid Mohammed Amri","hamri@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0067","2026-06-20T09:06:48.265Z"],
  ["Abdullah Said Hamood Al Waihibi","awuhaibi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0022","2026-06-20T09:06:48.265Z"],
  ["Saud Said Hamood Al Shabibi","ashabibi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0086","2026-06-20T09:06:48.265Z"],
  ["Abdullah Said Salim Al Hinai","ahinai@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0050","2026-06-20T09:06:48.265Z"],
  ["Ahmed Hamed Nasser Al Aghbari","aaghbari@falconofs.com","USER","Active","XOM Well Maintenance","NCP Operator","L-FWM-0053","2026-06-20T09:06:48.265Z"],
  ["Sulaiman Nasser Mattar Al Masqari","smasqari@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0041","2026-06-20T09:06:48.265Z"],
  ["Sultan Khamis Mohsin Al Busaidi","sbusaidi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0012","2026-06-20T09:06:48.265Z"],
  ["Salim Khalfan Hamed Al Bahlouli","sbahlouli@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0039","2026-06-20T09:06:48.265Z"],
  ["Musalem Abdullah Al Mukhaini","mmukhaini@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0077","2026-06-20T09:06:48.265Z"],
  ["Khamis Salim Thani Al Busaidi","kbusaidi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0031","2026-06-20T09:06:48.265Z"],
  ["Hamdan Mohammed Salim Al Qanoobi","hqanoobi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0064","2026-06-20T09:06:48.265Z"],
  ["Badar Nasser Said Al Hadiwi","bhadaiwi@falconofs.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0023","2026-06-20T09:06:48.265Z"],
  ["Ali Salim Ali Al Sawafi","alialsawafi26@gmail.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-HIR-0083","2026-06-20T09:06:48.265Z"],
  ["Ahmed Musabah Ali Al Quraini","ahmed6870@gmail.com","USER","Active","XOM Well Maintenance","NCP Assistant","L-FWM-0055","2026-06-20T09:06:48.265Z"],
  ["Gibi John","gibijohn@falconofs.com","USER","Active","XOM Well Maintenance","NCP / Fbl Supervisor","E-FWM-0104","2026-06-20T09:06:48.265Z"],
  ["Saif Said Nasser Al Rashdi","fwm-sr-bm@falconstaff.org","USER","Active","XOM Well Maintenance","MPLT Engineer","L-FWM-0036","2026-06-20T09:06:48.265Z"],
  ["Hamood Mohammed Marzouq Al Badi","hamoodalbadi@gmail.com","SITE MANAGER","Active","XOM Well Maintenance","MPLT Engineer","L-FWM-0066","2026-06-20T09:06:48.265Z"],
  ["Khamis Said Al Amri","khamri@falconofs.com","USER","Active","Falcon Oilfield Services","Mechanic","L-NSE-0132","2026-06-20T09:06:48.265Z"],
  ["Jagannatha Achary","jagas84@gmail.com","USER","Active","XOM Well Maintenance","Mechanic","E-FWM-0108","2026-06-20T09:06:48.265Z"],
  ["Moosa Nasser Khalfan Al Fahdi","afahdi@falconofs.com","USER","Active","XOM Well Maintenance","Mechanic","L-HIR-0092","2026-06-20T09:06:48.265Z"],
  ["Sultan Salim AlHabsi","shabsi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0030","2026-06-20T09:06:48.265Z"],
  ["Mohammed Sultan Al Shabibi","mshabibi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0028","2026-06-20T09:06:48.265Z"],
  ["Muhannad Mohamed AlBalushi","mbalushi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0031","2026-06-20T09:06:48.265Z"],
  ["Fahad Khalfan Matar Al-Mazroui","fmazroui@xomoman.com","USER","Active","XOM Drilling System","MWD Trainee","L-FDS-0034","2026-06-20T09:06:48.265Z"],
  ["Bilal Abdullah Malik","bmalik@xomoman.com","USER","Active","XOM Drilling System","Measurement & Logging While Drilling Engineer","E-FDS-0004","2026-06-20T09:06:48.265Z"],
  ["Ahmed Mohammed Said Al-omairi","aomairi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0015","2026-06-20T09:06:48.265Z"],
  ["Zahran Al Aufi","zoufi@falconofs.com","MANAGEMENT","Active","Falcon Oilfield Services","Managing Director","L-SHE-0001","2026-06-20T09:06:48.265Z"],
  ["Yaqoob Awadh Salim Al Hinai","fwm-sr-mechanic@falconofs.com","USER","Active","XOM Well Maintenance","Maintenance Supervisor","L-FWM-0091","2026-06-20T09:06:48.265Z"],
  ["Ali Khalifa Al-Ismaili","akismaili@xomoman.com","SITE MANAGER","Active","XOM Drilling System","Maintenance Manager","L-FDS-0006","2026-06-20T09:06:48.265Z"],
  ["vahed goudarzi","vgoudarzi@falconstaff.org","USER","Active","Falcon Oilfield Services","Log analyst","E-NSEC-0001","2026-06-20T09:06:48.265Z"],
  ["Hamad Said Amour Batrani","hbatrani@falconofs.com","USER - JM","Active","XOM Well Maintenance","Journey manager / store keeper","L-FWM-0063","2026-06-20T09:06:48.265Z"],
  ["Zakiya Salim Al Naabi","znaabi@falconofs.com","HSE ADMIN","Active","Falcon Oilfield Services","HSE-HR Admin Assistant","L-FIN-0034","2026-06-20T09:06:48.265Z"],
  ["HSE FWM","fwm-sr-hse@falconofs.com","HSE","Inactive","XOM Well Maintenance","HSE Advisor","HSE FWM","2026-06-20T09:06:48.265Z"],
  ["Zakariya Yahya Al Busaidi","zbusaidi@xomoman.com","HSE ADMIN","Active","XOM Well Maintenance","HSE Advisor","L-HIR-0115","2026-06-20T09:06:48.265Z"],
  ["Mohammed Humaid Salim Al Alawi","malawi@xomoman.com","HSE","Active","XOM Well Maintenance","HSE Advisor","L-FWM-0033","2026-06-20T09:06:48.265Z"],
  ["Mohamed Abdullah Al Shukaili","mashukaili@falconofs.com","HR","Inactive","XOM LLC","HR Manager","L-FIN-0019","2026-06-20T09:06:48.265Z"],
  ["Riam Zaid Al Saadi","riyam@falconofs.com","HR","Active","Falcon Oilfield Services","HR Manager","L-NSE-0238","2026-06-20T09:06:48.265Z"],
  ["Hanan Ahmed Al Shuhaibi","hshuhaibi@falconstaff.org","HR","Inactive","XOM LLC","HR Assistant","L-FIN-0038","2026-06-20T09:06:48.265Z"],
  ["Muntasar Salem Alomiri","montasr007@gmail.com","USER","Inactive","XOM Well Maintenance","Helper","L-HIR-0142","2026-06-20T09:06:48.265Z"],
  ["Muayid Khalid Said Al Mudhaffar","mmudhaffar@falconofs.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0034","2026-06-20T09:06:48.265Z"],
  ["Bader Abdullah AlRusheidi","bader2988@gmail.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0144","2026-06-20T09:06:48.265Z"],
  ["Haitham Ahmed AlMahmoodi","atm911atm@yahoo.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0143","2026-06-20T09:06:48.265Z"],
  ["Ali Salim Saleh Al Oraimi","aoraimi@falconofs.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0064","2026-06-20T09:06:48.265Z"],
  ["Ahmed Maktoum Maayouf AL Khamisi","akhamisi@falconofs.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0084","2026-06-20T09:06:48.265Z"],
  ["Ashraf Sulaiyam Khalfan Al Alawi","allwyashrf82@gmail.com","USER","Active","XOM Well Maintenance","Helper","L-HIR-0090","2026-06-20T09:06:48.265Z"],
  ["Salim Ali Al Shaqsi","sshaqsi@falconofs.com","USER","Active","Falcon Oilfield Services","Gun Loader - Trainee","L-NSE-0183","2026-06-20T09:06:48.265Z"],
  ["Saad Sabaiyah Al Nofli","snofli@falconofs.com","USER","Active","Falcon Oilfield Services","Gun Loader","L-NSE-0105","2026-06-20T09:06:48.265Z"],
  ["Rashid Saif Al Sawafi","rsawafi@falconofs.com","USER","Active","Falcon Oilfield Services","Gun Loader","L-NSE-0093","2026-06-20T09:06:48.265Z"],
  ["Hilal Ali Al Kalbani","hilal.alkalbani@falconinvs.com","MANAGEMENT","Active","XOM LLC","General Manager","L-FIN-0028","2026-06-20T09:06:48.265Z"],
  ["Amor Ali Salim Al Shukairi","ashukairi@falconofs.com","USER","Active","XOM Well Maintenance","Gauge Engineer","L-FWM-0017","2026-06-20T09:06:48.265Z"],
  ["Hamed Mohammed Al Kindi","hkindi@falconofs.com","USER","Active","Falcon Oilfield Services","FQA Gun Shop Supervisor","L-NSE-0190","2026-06-20T09:06:48.265Z"],
  ["Salim Khalifa Hilal Al Mashaikhi","smashaikhi@falconofs.com","USER","Active","XOM Well Maintenance","Fork Lift Operator","L-FWM-0095","2026-06-20T09:06:48.265Z"],
  ["Hamed Salim Hamed Al Madhoushi","hmadhoushi@falconofs.com","USER","Active","XOM Well Maintenance","Fork Lift Operator","L-FWM-0093","2026-06-20T09:06:48.265Z"],
  ["Jibu Varghese","jvarghese@xomoman.com","USER","Active","XOM LLC","Finance manager","E-FIN-0032","2026-06-20T09:06:48.265Z"],
  ["Waleed Mubarak Said Al Matani","wmatani@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Operator","L-HIR-0033","2026-06-20T09:06:48.265Z"],
  ["Mohammed Said Ali Al Aufi","maufi@falconofs.com","USER","Active","XOM Well Maintenance","Slickline Operator","L-HIR-0066","2026-06-20T09:06:48.265Z"],
  ["Sultan Saif Al Alawi","salawi@falconofs.com","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0172","2026-06-20T09:06:48.265Z"],
  ["Adil Ali Al Riyami","aariyami@falconofs.com","USER","Active","Falcon Oilfield Services","Senior Field Operator","L-NSE-0178","2026-06-20T09:06:48.265Z"],
  ["Shujaat Ali Khan","salikhan@falconofs.com","USER","Inactive","Falcon Oilfield Services","Field Engineer","E-HIR-0116","2026-06-20T09:06:48.265Z"],
  ["Rhike Arifka","rarifka@falconofs.com","USER","Inactive","Falcon Oilfield Services","Field Engineer","E-NSE-0037","2026-06-20T09:06:48.265Z"],
  ["Farrukh Hameed","fhameed@falconofs.com","USER","Active","Falcon Oilfield Services","Field Engineer","E-HIR-0077","2026-06-20T09:06:48.265Z"],
  ["Ahmed Al Hashmi","ahashmi@falconofs.com","USER","Active","Falcon Oilfield Services","Workshop Foremen","L-NSE-0004","2026-06-20T09:06:48.265Z"],
  ["Muchtar Mochamed","muchtar@falconofs.com","SITE MANAGER","Active","Falcon Oilfield Services","Engineer In Charge","E-NSE-0026","2026-06-20T09:06:48.265Z"],
  ["Joao Luis Fernandes","jluis@xomoman.com","USER","Active","XOM Drilling System","Electronics Technician","E-FDS-0043","2026-06-20T09:06:48.265Z"],
  ["Ayman Ali Saleh Al-Mazroui","aalmazroui@xomoman.com","USER","Active","XOM Drilling System","Electronics Technician","L-FDS-0035","2026-06-20T09:06:48.265Z"],
  ["Sharath Kumar","skumar@falconofs.com","USER","Active","XOM Well Maintenance","Electrician","E-FWM-0105","2026-06-20T09:06:48.265Z"],
  ["Sulaiyam Salim Saif Al Daraiee","sduree@falconofs.com","USER","Inactive","XOM Well Maintenance","Driver (HD)","L-FWM-0088","2026-06-20T09:06:48.265Z"],
  ["Suhail Ahmed Tabouk","stabouk@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0001","2026-06-20T09:06:48.265Z"],
  ["Said Sulaiman AlHoqani","shoqani@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0008","2026-06-20T09:06:48.265Z"],
  ["Nasser Khamis AlRawahi","nrawahi@xomoman.com","USER","Active","XOM Drilling System","Directional Driller Trainee","L-FDS-0020","2026-06-20T09:06:48.265Z"],
  ["Al Makhtar Masaaod Al-Adawi","madawi@xomoman.com","USER","Active","XOM Drilling System","Operations Support","L-FDS-0029","2026-06-20T09:06:48.265Z"],
  ["Khalid Zahran Busaidi","kzbusaidi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0002","2026-06-20T09:06:48.265Z"],
  ["Khalid Juma ALOraimi","koraimi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0025","2026-06-20T09:06:48.265Z"],
  ["Khalid Nasser AlBusaidi","knbusaidi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0016","2026-06-20T09:06:48.265Z"],
  ["Idris Surur AlAlawi","ialawi@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0012","2026-06-20T09:06:48.265Z"],
  ["Hosni Mubarak Al-Amri","hamri@xomoman.com","USER","Active","XOM Drilling System","Directional Drilling Engineer","L-FDS-0013","2026-06-20T09:06:48.265Z"],
  ["I A Xom","xom870@xomoman.com","HSE","Active","XOM Oman","Admin and HR","00012","2026-06-20T09:06:48.265Z"],
  ["Abdullah Hilal Al Ismaili","ahismaili@falconofs.com","USER","Active","Falcon Oilfield Services","Desk Engineer","L-HIR-0079","2026-06-20T09:06:48.265Z"],
  ["Said Mohamed Said Al Zakwani","szakwani@xomoman.com","SITE MANAGER","Active","XOM Well Maintenance","Operations Manager","L-FWM-0002","2026-06-20T09:06:48.265Z"],
  ["Yahya Ahmed Al Busaidi","ybusaidi@falconofs.com","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0196","2026-06-20T09:06:48.265Z"],
  ["Wagdi Suleyim Al Hinai","whinai@falconofs.com","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0124","2026-06-20T09:06:48.265Z"],
  ["Issa Saleh Al Amri","iamri@falconofs.com","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0174","2026-06-20T09:06:48.265Z"],
  ["Ahmed Mattar Al Qamshooey","aqamshooey@falconofs.com","USER","Active","Falcon Oilfield Services","Crew Chief","L-NSE-0176","2026-06-20T09:06:48.265Z"],
  ["Jatinderjit Singh","jsingh@falconofs.com","USER","Inactive","Falcon Oilfield Services","Crane Operator","E-NSE-0049","2026-06-20T09:06:48.265Z"],
  ["Hemza Benchelloug","hbenchelloug@falconofs.com","SITE MANAGER","Active","XOM Well Maintenance","Client Services Engineer","E-FWM-0120","2026-06-20T09:06:48.265Z"],
  ["Mohammed Salim Al Barashdi","mbarashdi@xomoman.com","MANAGEMENT","Active","XOM Oman","Chief Operating Officer","L-NSE-0191","2026-06-20T09:06:48.265Z"],
  ["Nasser Humaid Al Harrasi","nharrasi@falconofs.com","USER","Active","Falcon Oilfield Services","Cable Specialist","L-NSE-0079","2026-06-20T09:06:48.265Z"],
  ["Sultan Abdullah Al Tawqi","stawqi@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0089","2026-06-20T09:06:48.265Z"],
  ["Sultan Said Saif Said Al Maamari","smaamari@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0044","2026-06-20T09:06:48.265Z"],
  ["Sulaiman Musabah Khamis Al Ghafri","sghafri@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0087","2026-06-20T09:06:48.265Z"],
  ["Sanad Rashid Masoud Al Aliyani","saliyani@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0085","2026-06-20T09:06:48.265Z"],
  ["Rashid Salim Rashid Al Junaibi","rjunaibi@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0078","2026-06-20T09:06:48.265Z"],
  ["Rashid Mohammed Khasib Al Bakri","rbakri@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0009","2026-06-20T09:06:48.265Z"],
  ["Naseer Khalfan Masoud Al Habesi","nhabsi@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0013","2026-06-20T09:06:48.266Z"],
  ["Mohammed Abdullah Hamdan Al Nasseri","mnasseri@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0007","2026-06-20T09:06:48.266Z"],
  ["Jasim Khazam Said Al Sulaimi","jsulaimi@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0071","2026-06-20T09:06:48.266Z"],
  ["Hamed Ali Sulaiyim Al Syabi","hsiyabi@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0026","2026-06-20T09:06:48.266Z"],
  ["Humid Mubarak Humid Al Jabri","hjabri@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0029","2026-06-20T09:06:48.266Z"],
  ["Hamid Said Mohammed Al Gahaffi","hamadsaidmuhammad@gmail.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-HIR-0146","2026-06-20T09:06:48.266Z"],
  ["Ashraf Khalaf Khalfan Al Musallami","amusallami@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0059","2026-06-20T09:06:48.266Z"],
  ["Ali Abdullah Humaid Al Kalbani","akalbani@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0047","2026-06-20T09:06:48.266Z"],
  ["Ahmed Khalfan Salim Al Hazami","ahizami@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0054","2026-06-20T09:06:48.266Z"],
  ["Ali Ahmed Adam Al Bulushi","ahbalushi@falconofs.com","USER","Active","XOM Well Maintenance","Tool Technician","L-FWM-0056","2026-06-20T09:06:48.266Z"],
  ["Abdullah Sulaiman Al Brashdi","abrashdi@falconofs.com","USER","Active","XOM Well Maintenance","Assistant WL Operator","L-FWM-0052","2026-06-20T09:06:48.266Z"],
  ["Prasenjit Mondal","pmondal@falconofs.com","SITE MANAGER","Active","Falcon Oilfield Services","Asset Assurance Manager","E-HIR-0071","2026-06-20T09:06:48.266Z"],
  ["Sufya Ahmed Al Riyami","sriyami@falconofs.com","HR","Inactive","Falcon Oilfield Services","Administrator Assistant","L-FIN-0036","2026-06-20T09:06:48.266Z"],
  ["Hajer salim Al Sharji","hajar.alsharji199555@gmail.com","HR","Active","XOM LLC","Administrator Assistant","L-FIN-0045","2026-06-20T09:06:48.266Z"],
  ["Mohammed Said Sulaiyam Alabri","mabri@falconofs.com","HR","Active","XOM Well Maintenance","Administrator","L-FWM-0032","2026-06-20T09:06:48.266Z"],
  ["Khalid Mattar AL Saaidi","khalid.alsaaidi@outlook.com","HR","Inactive","XOM Well Maintenance","Admin and HR","L-HIR-0145","2026-06-20T09:06:48.266Z"],
  ["Ebin John","ebin.john@falconinvs.com","USER","Active","XOM LLC","Accountant","E-FIN-0039","2026-06-20T09:06:48.266Z"],
  ["Ahsan Sajjad","ahsan@falconinvs.com","USER","Active","XOM LLC","Accountant","E-FIN-0021","2026-06-20T09:06:48.266Z"],
  ["Arunangshu Banerjee","abanerjee@falconofs.com","USER","Active","Falcon Oilfield Services","Accountant","E-NSE-0004","2026-06-20T09:06:48.266Z"],
  ["Syed Sadaqat ADMIN","xom-himaya@falconinvs.com","ADMIN SYSTEM","Active","XOM Oman","Accountant Treasury","ADMIN","2026-06-20T09:06:48.266Z"],
]

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let inserted = 0
    let skipped = 0
    let empUpserted = 0

    for (const [name, email, role, status, businessUnit, designation, payrollNo, createdDate] of users) {
      const banned = status === 'Inactive'
      const createdAt = new Date(createdDate)

      // Upsert into neon_auth.user (skip if email already exists)
      const res = await client.query(`
        INSERT INTO neon_auth.user (id, name, email, role, banned, "emailVerified", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, false, $6, $6)
        ON CONFLICT (email) DO UPDATE
          SET name        = EXCLUDED.name,
              role        = EXCLUDED.role,
              banned      = EXCLUDED.banned,
              "updatedAt" = EXCLUDED."updatedAt"
        RETURNING id
      `, [randomUUID(), name, email.toLowerCase(), role, banned, createdAt])

      const userId = res.rows[0].id
      inserted++

      // Upsert into public.employee — id = payroll_no (the PK)
      // Use a unique suffix if payroll_no is empty/duplicate
      const empId = (payrollNo && payrollNo.trim()) ? payrollNo.trim() : `EMP-${email.toLowerCase()}`
      await client.query(`
        INSERT INTO public.employee (id, email, name, payroll_no, designation, business_unit, hse_role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE
          SET name          = EXCLUDED.name,
              payroll_no    = EXCLUDED.payroll_no,
              designation   = EXCLUDED.designation,
              business_unit = EXCLUDED.business_unit,
              hse_role      = EXCLUDED.hse_role,
              status        = EXCLUDED.status
      `, [empId, email.toLowerCase(), name, empId, designation, businessUnit, role, status])

      empUpserted++
    }

    await client.query('COMMIT')
    console.log(`Done! neon_auth.user: ${inserted} upserted | public.employee: ${empUpserted} upserted`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Import failed, rolled back:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
