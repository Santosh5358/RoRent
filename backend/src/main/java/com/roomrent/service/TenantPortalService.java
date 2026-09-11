package com.roomrent.service;

import com.roomrent.dto.TenantProfileResponse;
import com.roomrent.exception.ApiException;
import com.roomrent.model.*;
import com.roomrent.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Read-only data access scoped to the currently logged-in tenant.
 */
@Service
public class TenantPortalService {

    private final TenantRepository tenantRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final BillRepository billRepository;
    private final MeterReadingRepository readingRepository;
    private final PaymentRepository paymentRepository;
    private final ElectricityRateService rateService;
    private final BillService billService;
    private final ReceiptService receiptService;

    public TenantPortalService(TenantRepository tenantRepository,
                               RoomRepository roomRepository,
                               PropertyRepository propertyRepository,
                               BillRepository billRepository,
                               MeterReadingRepository readingRepository,
                               PaymentRepository paymentRepository,
                               ElectricityRateService rateService,
                               BillService billService,
                               ReceiptService receiptService) {
        this.tenantRepository = tenantRepository;
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
        this.billRepository = billRepository;
        this.readingRepository = readingRepository;
        this.paymentRepository = paymentRepository;
        this.rateService = rateService;
        this.billService = billService;
        this.receiptService = receiptService;
    }

    private Tenant tenant(Long tenantId) {
        if (tenantId == null) {
            throw ApiException.forbidden("No tenant is linked to this account");
        }
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> ApiException.notFound("Tenant not found"));
    }

    public TenantProfileResponse profile(Long tenantId) {
        Tenant tenant = tenant(tenantId);

        Room room = tenant.getRoomId() != null
                ? roomRepository.findById(tenant.getRoomId()).orElse(null) : null;
        Property property = tenant.getPropertyId() != null
                ? propertyRepository.findById(tenant.getPropertyId()).orElse(null) : null;

        BigDecimal rate = room != null ? rateService.resolveRate(room, LocalDate.now()) : BigDecimal.ZERO;

        List<Bill> bills = billRepository.findByTenantIdOrderByBillingMonthDescIdDesc(tenantId);
        BigDecimal outstanding = BigDecimal.ZERO;
        long unpaid = 0;
        for (Bill b : bills) {
            BigDecimal due = billService.outstanding(b);
            if (due.signum() > 0) {
                outstanding = outstanding.add(due);
                unpaid++;
            }
        }

        return new TenantProfileResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getPhone(),
                tenant.getEmail(),
                property != null ? property.getName() : null,
                room != null ? room.getRoomNumber() : null,
                room != null ? room.getFloor() : null,
                tenant.getMonthlyRent(),
                rate,
                outstanding,
                bills.size(),
                unpaid);
    }

    public List<Bill> bills(Long tenantId) {
        tenant(tenantId);
        return billRepository.findByTenantIdOrderByBillingMonthDescIdDesc(tenantId);
    }

    public Bill bill(Long tenantId, Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> ApiException.notFound("Bill not found"));
        if (!bill.getTenantId().equals(tenantId)) {
            throw ApiException.forbidden("This bill does not belong to you");
        }
        return bill;
    }

    public byte[] receipt(Long tenantId, Long billId) {
        return receiptService.generatePdfForBill(bill(tenantId, billId));
    }

    public List<MeterReading> readings(Long tenantId) {
        tenant(tenantId);
        return readingRepository.findByTenantIdOrderByReadingDateDescIdDesc(tenantId);
    }

    public List<Payment> payments(Long tenantId) {
        tenant(tenantId);
        return paymentRepository.findByTenantIdOrderByPaymentDateDescIdDesc(tenantId);
    }
}
