# Software Requirements Specification (SRS)
## ZKTeco Multi-Device Attendance Management System

**Document Version:** 1.0  
**Date:** August 18, 2025  
**Prepared For:** Senior Management & Development Team  
**Project:** Multi-Device Biometric Attendance System

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Current System vs. Future System](#current-system-vs-future-system)
4. [Technical Requirements](#technical-requirements)
5. [Business Requirements](#business-requirements)
6. [Security Requirements](#security-requirements)
7. [User Interface Requirements](#user-interface-requirements)
8. [Workflow & Process](#workflow--process)
9. [Timeline & Resources](#timeline--resources)
10. [Statement of Work (SOW)](#statement-of-work-sow)
11. [Risk Assessment](#risk-assessment)
12. [Success Criteria](#success-criteria)

---

## Executive Summary

### What is this project?
This project transforms our current single biometric device system into a powerful multi-device attendance management solution that can handle 4-5 biometric machines across different countries, automatically collect attendance data, and send it to Google Sheets through automated workflows.

### Why do we need this?
- **Current Problem**: We can only handle one biometric device at a time
- **Business Need**: We need to manage multiple offices in different countries
- **Solution**: A scalable system that can handle multiple devices automatically

### Key Benefits:
- ✅ Manage multiple offices from one system
- ✅ Automatic data collection and processing
- ✅ Secure data handling across countries
- ✅ Real-time monitoring and reporting
- ✅ Reduced manual work and errors

---

## Project Overview

### Current System (What we have now)
```
Single Device → Single API → Manual Data Processing
```
- One biometric device connected to one server
- Manual data collection and processing
- Basic webhook functionality
- Limited scalability

### Future System (What we want to build)
```
Multiple Devices → Centralized System → Automated Processing → Google Sheets
```
- 4-5 biometric devices across different countries
- Automatic data collection every 30 minutes
- Secure data transmission and processing
- Automated Google Sheets integration

---

## Current System vs. Future System

| Aspect | Current System | Future System |
|--------|---------------|---------------|
| **Number of Devices** | 1 device | 4-5 devices |
| **Geographic Coverage** | Single location | Multiple countries |
| **Data Collection** | Manual/Webhook | Automatic every 30 minutes |
| **Data Processing** | Manual | Automated through N8N |
| **Data Storage** | Local files | Google Sheets + Database |
| **Security** | Basic | Enterprise-grade security |
| **Monitoring** | Basic logs | Real-time dashboard |
| **Scalability** | Limited | Highly scalable |

---

## Technical Requirements

### 1. Multi-Device Support

#### What this means:
Instead of connecting to just one biometric device, our system will connect to 4-5 devices simultaneously.

#### How it works:
```
Device 01 (Office A) → Central Server
Device 02 (Office B) → Central Server  
Device 03 (Office C) → Central Server
Device 04 (Office D) → Central Server
Device 05 (Office E) → Central Server
```

#### Technical Details:
- Each device gets a unique code (01, 02, 03, 04, 05)
- System connects to all devices every 30 minutes
- Data from each device is stored separately
- If one device fails, others continue working

### 2. API Structure

#### Current API (Single Device):
```
GET /attendance/today
GET /attendance/device/info
GET /attendance/webhook/today
```

#### Future API (Multiple Devices):
```
GET /attendance/01/today          (Device 01 data)
GET /attendance/02/today          (Device 02 data)
GET /attendance/03/device/info    (Device 03 info)
GET /attendance/04/webhook/today  (Device 04 webhook)
GET /attendance/05/health         (Device 05 health)
```

#### Simple Explanation:
Think of it like having 5 different folders on your computer, each containing files for a different office. When you want data from Office A, you go to folder "01". When you want data from Office B, you go to folder "02".

### 3. Configuration Management

#### Environment File (.env):
```env
# Device 01 - Office A
MACHINE_01_IP=192.168.1.113
MACHINE_01_PORT=4370
MACHINE_01_CODE=01
MACHINE_01_NAME="Office A - Main Building"

# Device 02 - Office B  
MACHINE_02_IP=192.168.1.114
MACHINE_02_PORT=4370
MACHINE_02_CODE=02
MACHINE_02_NAME="Office B - Branch Office"

# Continue for devices 03, 04, 05...
```

#### Simple Explanation:
This is like having a contact list for each office. We store the "phone number" (IP address) and "extension" (port) for each biometric device, so our system knows how to call each office.

---

## Business Requirements

### 1. Multi-Country Deployment

#### What this means:
Our biometric devices will be located in different countries, and we need to collect data from all of them.

#### Challenges:
- **Time Zones**: Different offices in different time zones
- **Network Security**: Secure data transmission across countries
- **Local Regulations**: Each country has different data protection laws
- **Network Reliability**: Internet connections may be unstable

#### Solutions:
- **Static IP Addresses**: Each device gets a permanent "phone number"
- **VPN Connections**: Secure tunnels for data transmission
- **Time Zone Handling**: Automatic conversion of attendance times
- **Local Compliance**: Follow each country's data protection laws

### 2. Data Processing Workflow

#### Current Process:
```
Device → Manual Check → Copy Data → Paste in Excel
```

#### Future Process:
```
Device → Automatic Collection → N8N Processing → Google Sheets
```

#### Step-by-Step Explanation:
1. **Data Collection**: System automatically checks each device every 30 minutes
2. **Data Transmission**: Sends data securely to N8N (automation platform)
3. **Data Processing**: N8N filters, organizes, and processes the data
4. **Data Storage**: Processed data is automatically added to Google Sheets
5. **Automation**: Google Apps Script handles additional data manipulation

---

## Security Requirements

### 1. API Security

#### What we need to protect:
- Unauthorized access to attendance data
- Data tampering or manipulation
- System overload from too many requests

#### Security Measures:
- **Authentication**: Users must log in with username/password
- **API Keys**: Each device gets a unique "key" for access
- **Rate Limiting**: Prevent too many requests at once
- **IP Whitelisting**: Only allow access from known locations

#### Simple Explanation:
Think of it like a secure building. You need:
- A key card to enter (authentication)
- A specific key for each floor (API keys)
- Limits on how many people can enter at once (rate limiting)
- Only people from approved companies can enter (IP whitelisting)

### 2. Data Security

#### What we need to protect:
- Employee attendance records
- Personal information
- System configuration data

#### Security Measures:
- **Encryption**: Data is scrambled so only authorized people can read it
- **Secure Storage**: Data is stored in secure, encrypted databases
- **Access Control**: Only authorized users can access specific data
- **Audit Logs**: We keep records of who accessed what data and when

#### Simple Explanation:
Think of it like a bank vault:
- Money is locked in secure boxes (encryption)
- Only authorized bank employees can access the vault (access control)
- Every time someone enters the vault, it's recorded (audit logs)
- The vault itself is protected by multiple security systems (secure storage)

### 3. Network Security

#### What we need to protect:
- Data transmission between devices and server
- Server connections from different countries
- Internal network communications

#### Security Measures:
- **VPN Tunnels**: Secure connections between offices and server
- **SSL/TLS**: Encrypted data transmission
- **Firewall Protection**: Block unauthorized network access
- **Regular Security Updates**: Keep security systems up to date

---

## User Interface Requirements

### 1. Management Dashboard

#### What the dashboard will show:
- **Device Status**: Which devices are online/offline
- **Data Collection**: Recent data collection activities
- **Error Alerts**: Any problems with devices or data collection
- **Manual Controls**: Buttons to manually start/stop data collection

#### Simple Explanation:
Think of it like a control panel for a building:
- Green lights show which systems are working
- Red lights show which systems need attention
- Buttons let you manually control different systems
- Screens show you what's happening in real-time

### 2. Device Management Interface

#### Features:
- **Add New Device**: Easy form to add a new biometric device
- **Device Configuration**: Settings for each device
- **Connection Testing**: Test if a device is reachable
- **Device Health**: Monitor device performance and status

#### Simple Explanation:
Think of it like managing a fleet of cars:
- You can add new cars to your fleet
- You can configure each car's settings
- You can test if each car is working properly
- You can monitor each car's performance

### 3. Webhook Configuration

#### Features:
- **N8N Integration**: Connect to N8N automation platform
- **Google Sheets Setup**: Configure Google Sheets integration
- **Test Connections**: Test if data is flowing correctly
- **Error Monitoring**: Monitor for any connection issues

---

## Workflow & Process

### 1. Data Collection Process

#### Step 1: Device Polling
```
Every 30 minutes, the system checks each device:
Device 01 → "Do you have new attendance data?"
Device 02 → "Do you have new attendance data?"
Device 03 → "Do you have new attendance data?"
Device 04 → "Do you have new attendance data?"
Device 05 → "Do you have new attendance data?"
```

#### Step 2: Data Collection
```
If a device has new data:
- Connect to the device securely
- Download the attendance records
- Verify the data is complete and accurate
- Store the data temporarily
```

#### Step 3: Data Processing
```
For each device's data:
- Format the data properly
- Add device identification
- Add timestamp and location
- Validate data quality
```

#### Step 4: Data Transmission
```
Send processed data to N8N:
- Package data securely
- Send via HTTP request
- Wait for confirmation
- Log the transmission
```

### 2. N8N Processing Workflow

#### Step 1: Data Reception
```
N8N receives data from our system:
- Validates the data format
- Checks data completeness
- Routes data to appropriate workflow
```

#### Step 2: Data Processing
```
N8N processes the data:
- Filters out invalid records
- Organizes data by employee
- Calculates attendance statistics
- Prepares data for Google Sheets
```

#### Step 3: Google Sheets Integration
```
N8N sends data to Google Sheets:
- Connects to appropriate Google Sheet
- Adds new attendance records
- Updates summary statistics
- Triggers any additional automation
```

### 3. Google Sheets Management

#### Sheet Structure:
```
Sheet 1: Raw Data (all attendance records)
Sheet 2: Employee Summary (per employee statistics)
Sheet 3: Daily Summary (daily attendance overview)
Sheet 4: Monthly Reports (monthly statistics)
Sheet 5: Device Status (device health monitoring)
```

#### Apps Script Automation:
```
Google Apps Script handles:
- Data formatting and organization
- Automatic report generation
- Email notifications
- Data validation and cleanup
```

---

## Timeline & Resources

### Development Phases

#### Phase 1: Foundation (Weeks 1-6)
**What we're building:**
- Multi-device API structure
- Database design and setup
- Basic security features
- Device connection management

**Deliverables:**
- Working multi-device API
- Database with test data
- Basic security implementation
- Device connection testing

**Timeline:** 6 weeks
**Resources:** 1 developer

#### Phase 2: User Interface (Weeks 7-10)
**What we're building:**
- Management dashboard
- Device configuration interface
- Webhook management system
- Monitoring and alerting

**Deliverables:**
- Working dashboard
- Device management interface
- Webhook configuration tools
- Real-time monitoring

**Timeline:** 4 weeks
**Resources:** 1 developer

#### Phase 3: Advanced Features (Weeks 11-14)
**What we're building:**
- Advanced security features
- Multi-country deployment setup
- Performance optimization
- Comprehensive testing

**Deliverables:**
- Enterprise-grade security
- Multi-country deployment guide
- Performance optimization
- Test results and documentation

**Timeline:** 4 weeks
**Resources:** 1 developer

#### Phase 4: Integration & Deployment (Weeks 15-17)
**What we're building:**
- N8N workflow integration
- Google Sheets integration
- Production deployment
- Training and documentation

**Deliverables:**
- Complete N8N integration
- Google Sheets automation
- Production-ready system
- User training materials

**Timeline:** 3 weeks
**Resources:** 1 developer

### Total Project Timeline
- **Total Duration:** 17 weeks (approximately 4 months)
- **Total Resources:** 1 full-time developer
- **Key Milestones:** Every 4-6 weeks

---

## Statement of Work (SOW)

### Project Scope

#### What's Included:
1. **Multi-Device API Development**
   - Support for 4-5 biometric devices
   - Device-specific API endpoints
   - Automatic data collection

2. **Security Implementation**
   - Authentication and authorization
   - Data encryption
   - Network security

3. **User Interface Development**
   - Management dashboard
   - Device configuration tools
   - Monitoring and alerting

4. **Integration Development**
   - N8N workflow integration
   - Google Sheets automation
   - Apps Script development

5. **Deployment & Testing**
   - Multi-country deployment setup
   - Comprehensive testing
   - Documentation and training

#### What's NOT Included:
- Hardware procurement (biometric devices)
- Network infrastructure setup
- Third-party software licenses
- Ongoing maintenance and support
- Custom feature development beyond scope

### Deliverables

#### 1. Software Deliverables
- Complete multi-device API system
- Management dashboard and interfaces
- Security implementation
- Integration with N8N and Google Sheets
- Configuration and deployment guides

#### 2. Documentation Deliverables
- Technical documentation
- User manuals
- API documentation
- Deployment guides
- Training materials

#### 3. Testing Deliverables
- Test plans and test cases
- Test results and reports
- Performance benchmarks
- Security audit reports

### Acceptance Criteria

#### Functional Requirements:
- ✅ System can connect to 4-5 biometric devices simultaneously
- ✅ Data is collected automatically every 30 minutes
- ✅ Data is securely transmitted to N8N
- ✅ Data is automatically processed and stored in Google Sheets
- ✅ Management dashboard shows real-time device status
- ✅ Security features prevent unauthorized access

#### Performance Requirements:
- ✅ System can handle 1000+ attendance records per day
- ✅ API response time under 2 seconds
- ✅ 99.9% uptime during business hours
- ✅ Data collection accuracy of 99.5%

#### Security Requirements:
- ✅ All data transmission is encrypted
- ✅ Access control prevents unauthorized users
- ✅ Audit logs track all system activities
- ✅ Security vulnerabilities are addressed

### Payment Schedule

#### Milestone 1: Foundation Complete (Week 6)
- **Deliverables:** Working multi-device API and database

#### Milestone 2: Interface Complete (Week 10)
- **Deliverables:** Management dashboard and device interfaces

#### Milestone 3: Advanced Features Complete (Week 14)
- **Deliverables:** Security features and optimization

#### Milestone 4: Project Complete (Week 17)
- **Deliverables:** Complete system with integrations

---

## Risk Assessment

### Technical Risks

#### Risk 1: Device Connectivity Issues
**What could go wrong:** Biometric devices may lose connection or become unreachable.

**Impact:** Data collection could fail for specific devices.

**Mitigation:**
- Implement automatic retry mechanisms
- Set up alert systems for connection failures
- Provide manual data collection options
- Regular device health monitoring

#### Risk 2: Network Latency
**What could go wrong:** International connections may be slow or unreliable.

**Impact:** Data collection may be delayed or fail.

**Mitigation:**
- Implement timeout handling
- Use local caching for temporary data storage
- Set up redundant connection paths
- Monitor network performance

#### Risk 3: Data Synchronization Issues
**What could go wrong:** Data from different devices may not sync properly.

**Impact:** Attendance records may be incomplete or duplicated.

**Mitigation:**
- Implement data validation checks
- Use unique identifiers for each record
- Set up conflict resolution procedures
- Regular data integrity checks

### Business Risks

#### Risk 1: Timeline Delays
**What could go wrong:** Development may take longer than expected.

**Impact:** Project completion may be delayed.

**Mitigation:**
- Regular progress monitoring
- Flexible timeline with buffer periods
- Clear communication of delays
- Prioritization of critical features



#### Risk 2: User Adoption
**What could go wrong:** Users may not adopt the new system instantly.

**Impact:** System may not provide expected benefits initially.

**Mitigation:**
- User training and support
- Gradual rollout approach
- User feedback collection
- Continuous improvement process

---

## Success Criteria

### Technical Success Criteria
- ✅ System successfully connects to all 4-5 biometric devices
- ✅ Data is collected automatically without manual intervention
- ✅ Data flows correctly from devices to Google Sheets
- ✅ Security features prevent unauthorized access
- ✅ System performance meets specified requirements

### Business Success Criteria
- ✅ Reduced manual data collection time by 80%
- ✅ Improved data accuracy to 99.5%
- ✅ Real-time visibility into all office attendance
- ✅ Automated reporting and analytics
- ✅ Scalable system for future growth

### User Success Criteria
- ✅ Users can easily monitor all devices
- ✅ Users can configure new devices easily
- ✅ Users receive timely alerts for issues
- ✅ Users can access reports and analytics
- ✅ Users feel confident in system reliability

---

## Conclusion

This SRS document outlines a comprehensive plan to transform our current single-device attendance system into a powerful, scalable, multi-device solution. The project will enable us to manage attendance across multiple offices in different countries, with automated data collection, processing, and reporting.

The estimated timeline of 17 weeks (4 months) with one developer provides a realistic path to completion, while the phased approach ensures we can deliver value incrementally and manage risks effectively.

The system will provide significant business value through:
- Reduced manual work and errors
- Real-time visibility across all offices
- Automated reporting and analytics
- Scalable architecture for future growth
- Enterprise-grade security and reliability

By following this SRS, we will create a robust, secure, and user-friendly attendance management system that meets both current needs and future growth requirements.

---

**Document Prepared By:** Nysonian 
**Review Date:** August 18, 2025  
**Next Review:** September 18, 2025
