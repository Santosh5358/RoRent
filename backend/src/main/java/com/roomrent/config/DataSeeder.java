package com.roomrent.config;

import com.roomrent.model.*;
import com.roomrent.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Seeds demo data on first run so the app can be tested immediately.
 * Login: admin@roomrent.local / password123
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final RoomAssignmentRepository assignmentRepository;
    private final MeterReadingRepository readingRepository;
    private final ElectricityRateRepository rateRepository;
    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentSubmissionRepository submissionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PropertyRepository propertyRepository,
                      RoomRepository roomRepository, TenantRepository tenantRepository,
                      RoomAssignmentRepository assignmentRepository,
                      MeterReadingRepository readingRepository,
                      ElectricityRateRepository rateRepository, BillRepository billRepository,
                      PaymentRepository paymentRepository,
                      PaymentSubmissionRepository submissionRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.roomRepository = roomRepository;
        this.tenantRepository = tenantRepository;
        this.assignmentRepository = assignmentRepository;
        this.readingRepository = readingRepository;
        this.rateRepository = rateRepository;
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
        this.submissionRepository = submissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // already seeded
        }

        User owner = new User();
        owner.setName("Admin User");
        owner.setEmail("admin@roomrent.local");
        owner.setPhone("+91 90000 00000");
        owner.setPasswordHash(passwordEncoder.encode("password123"));
        owner.setRole(Role.OWNER);
        owner = userRepository.save(owner);
        Long ownerId = owner.getId();

        Property property = new Property();
        property.setOwnerId(ownerId);
        property.setName("Shanti Apartment");
        property.setAddress("12 MG Road, Bengaluru, Karnataka");
        property.setDefaultElectricityRate(new BigDecimal("8"));
        property = propertyRepository.save(property);
        Long propertyId = property.getId();

        // Property-level electricity rate history
        saveRate(ownerId, propertyId, null, new BigDecimal("7"), LocalDate.now().minusMonths(2).withDayOfMonth(1));
        saveRate(ownerId, propertyId, null, new BigDecimal("8"), LocalDate.now().minusMonths(1).withDayOfMonth(1));

        Room r101 = saveRoom(propertyId, "101", "1st", "8000", RoomStatus.OCCUPIED);
        Room r102 = saveRoom(propertyId, "102", "1st", "8500", RoomStatus.OCCUPIED);
        Room r103 = saveRoom(propertyId, "103", "1st", "7500", RoomStatus.OCCUPIED);
        saveRoom(propertyId, "104", "1st", "8000", RoomStatus.VACANT);

        Tenant rahul = saveTenant(ownerId, "Rahul Kumar", "+91 98111 11111", "rahul@example.com");
        Tenant amit = saveTenant(ownerId, "Amit Sharma", "+91 98222 22222", "amit@example.com");
        Tenant priya = saveTenant(ownerId, "Priya Singh", "+91 98333 33333", "priya@example.com");

        // Tenant login accounts (password: tenant123)
        saveTenantUser(rahul);
        saveTenantUser(amit);
        saveTenantUser(priya);

        assign(rahul, property, r101, new BigDecimal("8000"));
        assign(amit, property, r102, new BigDecimal("8500"));
        assign(priya, property, r103, new BigDecimal("7500"));

        // Meter reading history for room 101 (matches spec example)
        MeterReading m1 = saveReading(r101, rahul, LocalDate.now().minusMonths(2).withDayOfMonth(11),
                new BigDecimal("1000"), new BigDecimal("1120"), new BigDecimal("7"), ownerId);
        MeterReading m2 = saveReading(r101, rahul, LocalDate.now().minusMonths(1).withDayOfMonth(11),
                new BigDecimal("1120"), new BigDecimal("1250"), new BigDecimal("8"), ownerId);
        MeterReading m3 = saveReading(r101, rahul, LocalDate.now().withDayOfMonth(11),
                new BigDecimal("1250"), new BigDecimal("1380"), new BigDecimal("8"), ownerId);

        // Bills for room 101
        Bill bLast = saveBill(ownerId, rahul, r101, LocalDate.now().minusMonths(1).withDayOfMonth(1), m2,
                new BigDecimal("8000"), new BigDecimal("200"), BigDecimal.ZERO);
        Bill bThis = saveBill(ownerId, rahul, r101, LocalDate.now().withDayOfMonth(1), m3,
                new BigDecimal("8000"), new BigDecimal("200"), BigDecimal.ZERO);

        // A full payment on last month's bill, partial on this month
        savePayment(ownerId, bLast, bLast.getTotalAmount(), PaymentMethod.UPI, "UPI-REF-1001");
        recomputeAndSaveStatus(bLast);

        savePayment(ownerId, bThis, new BigDecimal("5000"), PaymentMethod.CASH, null);
        recomputeAndSaveStatus(bThis);

        // A pending tenant-submitted payment slip for the owner to review
        PaymentSubmission sub = new PaymentSubmission();
        sub.setOwnerId(ownerId);
        sub.setTenantId(rahul.getId());
        sub.setBillId(bThis.getId());
        sub.setCategory(PaymentCategory.BOTH);
        sub.setAmount(new BigDecimal("4240"));
        sub.setPaymentMethod(PaymentMethod.UPI);
        sub.setTransactionReference("UPI-REF-2044");
        sub.setNote("Paid remaining balance via GPay");
        sub.setSlipImageUrl("/uploads/slips/sample-slip.svg");
        sub.setStatus(SubmissionStatus.PENDING);
        submissionRepository.save(sub);
    }

    private void saveTenantUser(Tenant tenant) {
        if (tenant.getEmail() == null || tenant.getEmail().isBlank()) {
            return;
        }
        User u = new User();
        u.setName(tenant.getName());
        u.setEmail(tenant.getEmail().toLowerCase());
        u.setPhone(tenant.getPhone());
        u.setPasswordHash(passwordEncoder.encode("tenant123"));
        u.setRole(Role.TENANT);
        u.setTenantId(tenant.getId());
        userRepository.save(u);
    }

    private void saveRate(Long ownerId, Long propertyId, Long roomId, BigDecimal price, LocalDate from) {
        ElectricityRate rate = new ElectricityRate();
        rate.setOwnerId(ownerId);
        rate.setPropertyId(propertyId);
        rate.setRoomId(roomId);
        rate.setPricePerUnit(price);
        rate.setEffectiveFrom(from);
        rateRepository.save(rate);
    }

    private Room saveRoom(Long propertyId, String number, String floor, String rent, RoomStatus status) {
        Room room = new Room();
        room.setPropertyId(propertyId);
        room.setRoomNumber(number);
        room.setFloor(floor);
        room.setMonthlyRent(new BigDecimal(rent));
        room.setStatus(status);
        return roomRepository.save(room);
    }

    private Tenant saveTenant(Long ownerId, String name, String phone, String email) {
        Tenant tenant = new Tenant();
        tenant.setOwnerId(ownerId);
        tenant.setName(name);
        tenant.setPhone(phone);
        tenant.setEmail(email);
        tenant.setSecurityDeposit(new BigDecimal("10000"));
        tenant.setMoveInDate(LocalDate.now().minusMonths(6));
        return tenantRepository.save(tenant);
    }

    private void assign(Tenant tenant, Property property, Room room, BigDecimal rent) {
        RoomAssignment a = new RoomAssignment();
        a.setRoomId(room.getId());
        a.setTenantId(tenant.getId());
        a.setStartDate(LocalDate.now().minusMonths(6));
        a.setMonthlyRent(rent);
        assignmentRepository.save(a);

        tenant.setPropertyId(property.getId());
        tenant.setRoomId(room.getId());
        tenant.setMonthlyRent(rent);
        tenantRepository.save(tenant);

        room.setCurrentTenantId(tenant.getId());
        room.setStatus(RoomStatus.OCCUPIED);
        roomRepository.save(room);
    }

    private MeterReading saveReading(Room room, Tenant tenant, LocalDate date,
                                     BigDecimal prev, BigDecimal curr, BigDecimal rate, Long ownerId) {
        BigDecimal units = curr.subtract(prev);
        MeterReading m = new MeterReading();
        m.setRoomId(room.getId());
        m.setTenantId(tenant.getId());
        m.setReadingDate(date);
        m.setPreviousReading(prev);
        m.setCurrentReading(curr);
        m.setUnitsConsumed(units);
        m.setPricePerUnit(rate);
        m.setElectricityAmount(units.multiply(rate));
        m.setReadingSource(ReadingSource.MANUAL);
        m.setCreatedBy(ownerId);
        return readingRepository.save(m);
    }

    private Bill saveBill(Long ownerId, Tenant tenant, Room room, LocalDate month, MeterReading reading,
                          BigDecimal rent, BigDecimal other, BigDecimal discount) {
        Bill bill = new Bill();
        bill.setOwnerId(ownerId);
        bill.setTenantId(tenant.getId());
        bill.setRoomId(room.getId());
        bill.setBillingMonth(month);
        bill.setRentAmount(rent);
        bill.setPreviousReading(reading.getPreviousReading());
        bill.setCurrentReading(reading.getCurrentReading());
        bill.setUnitsConsumed(reading.getUnitsConsumed());
        bill.setPricePerUnit(reading.getPricePerUnit());
        bill.setElectricityAmount(reading.getElectricityAmount());
        bill.setOtherCharges(other);
        bill.setDiscount(discount);
        bill.setTotalAmount(rent.add(reading.getElectricityAmount()).add(other).subtract(discount));
        bill.setDueDate(month.plusMonths(1).withDayOfMonth(10));
        bill.setMeterReadingId(reading.getId());
        bill.setStatus(BillStatus.UNPAID);
        return billRepository.save(bill);
    }

    private void savePayment(Long ownerId, Bill bill, BigDecimal amount, PaymentMethod method, String ref) {
        Payment p = new Payment();
        p.setOwnerId(ownerId);
        p.setBillId(bill.getId());
        p.setTenantId(bill.getTenantId());
        p.setAmount(amount);
        p.setPaymentDate(LocalDate.now());
        p.setPaymentMethod(method);
        p.setTransactionReference(ref);
        paymentRepository.save(p);
        bill.setAmountPaid((bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO).add(amount));
    }

    private void recomputeAndSaveStatus(Bill bill) {
        BigDecimal paid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        if (paid.compareTo(bill.getTotalAmount()) >= 0) {
            bill.setStatus(BillStatus.PAID);
        } else if (paid.signum() > 0) {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        }
        billRepository.save(bill);
    }
}
