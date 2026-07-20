package com.billflow.app.gst

import com.billflow.app.data.local.BillItem
import kotlin.math.round

object GstCalculator {

    fun getSupplyType(businessStateCode: String?, customerStateCode: String?): String {
        if (businessStateCode.isNullOrBlank() || customerStateCode.isNullOrBlank()) {
            return "intrastate"
        }
        return if (businessStateCode.trim() == customerStateCode.trim()) "intrastate" else "interstate"
    }

    data class LineItemInput(
        val quantity: Double,
        val unitPrice: Double,
        val discountPercent: Double,
        val gstRate: Double,
        val supplyType: String = "intrastate"
    )

    data class LineItemResult(
        val quantity: Double,
        val unitPrice: Double,
        val discountPercent: Double,
        val gstRate: Double,
        val baseAmount: Double,
        val discountAmount: Double,
        val taxableAmount: Double,
        val cgstRate: Double,
        val cgstAmount: Double,
        val sgstRate: Double,
        val sgstAmount: Double,
        val igstRate: Double,
        val igstAmount: Double,
        val lineTotal: Double
    )

    private fun roundToTwoDecimals(value: Double): Double {
        return round(value * 100.0) / 100.0
    }

    fun calcLineItem(data: LineItemInput): LineItemResult {
        val qty = data.quantity
        val price = data.unitPrice
        val disc = data.discountPercent
        val rate = data.gstRate
        val supply = data.supplyType

        val baseAmount = qty * price
        val discountAmount = baseAmount * (disc / 100.0)
        val taxableAmount = baseAmount - discountAmount

        var cgstRate = 0.0
        var cgstAmount = 0.0
        var sgstRate = 0.0
        var sgstAmount = 0.0
        var igstRate = 0.0
        var igstAmount = 0.0

        if (supply == "intrastate") {
            cgstRate = rate / 2.0
            cgstAmount = taxableAmount * (cgstRate / 100.0)
            sgstRate = rate / 2.0
            sgstAmount = taxableAmount * (sgstRate / 100.0)
        } else {
            igstRate = rate
            igstAmount = taxableAmount * (igstRate / 100.0)
        }

        val lineTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount

        return LineItemResult(
            quantity = qty,
            unitPrice = price,
            discountPercent = disc,
            gstRate = rate,
            baseAmount = roundToTwoDecimals(baseAmount),
            discountAmount = roundToTwoDecimals(discountAmount),
            taxableAmount = roundToTwoDecimals(taxableAmount),
            cgstRate = cgstRate,
            cgstAmount = roundToTwoDecimals(cgstAmount),
            sgstRate = sgstRate,
            sgstAmount = roundToTwoDecimals(sgstAmount),
            igstRate = igstRate,
            igstAmount = roundToTwoDecimals(igstAmount),
            lineTotal = roundToTwoDecimals(lineTotal)
        )
    }

    data class BillTotals(
        val subtotal: Double,
        val totalDiscount: Double,
        val totalTaxable: Double,
        val totalCGST: Double,
        val totalSGST: Double,
        val totalIGST: Double,
        val totalTax: Double,
        val roundOff: Double,
        val grandTotal: Double
    )

    fun calcBillTotals(lineItemResults: List<LineItemResult>): BillTotals {
        var subtotal = 0.0
        var totalDiscount = 0.0
        var totalTaxable = 0.0
        var totalCGST = 0.0
        var totalSGST = 0.0
        var totalIGST = 0.0

        for (it in lineItemResults) {
            subtotal += it.baseAmount
            totalDiscount += it.discountAmount
            totalTaxable += it.taxableAmount
            totalCGST += it.cgstAmount
            totalSGST += it.sgstAmount
            totalIGST += it.igstAmount
        }

        val totalTax = totalCGST + totalSGST + totalIGST
        val rawGrandTotal = totalTaxable + totalTax
        val grandTotal = round(rawGrandTotal)
        val roundOff = grandTotal - rawGrandTotal

        return BillTotals(
            subtotal = roundToTwoDecimals(subtotal),
            totalDiscount = roundToTwoDecimals(totalDiscount),
            totalTaxable = roundToTwoDecimals(totalTaxable),
            totalCGST = roundToTwoDecimals(totalCGST),
            totalSGST = roundToTwoDecimals(totalSGST),
            totalIGST = roundToTwoDecimals(totalIGST),
            totalTax = roundToTwoDecimals(totalTax),
            roundOff = roundToTwoDecimals(roundOff),
            grandTotal = grandTotal
        )
    }

    data class RateWiseSummary(
        val rate: Double,
        val taxable: Double,
        val cgst: Double,
        val sgst: Double,
        val igst: Double
    )

    fun buildRateWiseBreakdown(items: List<LineItemResult>): List<RateWiseSummary> {
        val breakdown = mutableMapOf<Double, RateWiseSummary>()
        for (it in items) {
            val rate = it.gstRate
            val current = breakdown[rate] ?: RateWiseSummary(rate, 0.0, 0.0, 0.0, 0.0)
            breakdown[rate] = RateWiseSummary(
                rate = rate,
                taxable = current.taxable + it.taxableAmount,
                cgst = current.cgst + it.cgstAmount,
                sgst = current.sgst + it.sgstAmount,
                igst = current.igst + it.igstAmount
            )
        }
        return breakdown.values.map {
            RateWiseSummary(
                rate = it.rate,
                taxable = roundToTwoDecimals(it.taxable),
                cgst = roundToTwoDecimals(it.cgst),
                sgst = roundToTwoDecimals(it.sgst),
                igst = roundToTwoDecimals(it.igst)
            )
        }
    }

    data class HsnSummary(
        val hsnSac: String,
        val description: String,
        val unit: String,
        val quantity: Double,
        val taxable: Double,
        val cgst: Double,
        val sgst: Double,
        val igst: Double
    )

    fun buildHSNBreakdown(items: List<BillItem>): List<HsnSummary> {
        val breakdown = mutableMapOf<String, HsnSummary>()
        for (it in items) {
            val hsn = it.hsnSac ?: "OTHER"
            val current = breakdown[hsn] ?: HsnSummary(
                hsnSac = hsn,
                description = it.description ?: "",
                unit = it.unit,
                quantity = 0.0,
                taxable = 0.0,
                cgst = 0.0,
                sgst = 0.0,
                igst = 0.0
            )
            breakdown[hsn] = HsnSummary(
                hsnSac = hsn,
                description = current.description,
                unit = current.unit,
                quantity = current.quantity + (it.quantity ?: 0.0),
                taxable = current.taxable + (it.taxableAmount ?: 0.0),
                cgst = current.cgst + (it.cgstAmount ?: 0.0),
                sgst = current.sgst + (it.sgstAmount ?: 0.0),
                igst = current.igst + (it.igstAmount ?: 0.0)
            )
        }
        return breakdown.values.map {
            HsnSummary(
                hsnSac = it.hsnSac,
                description = it.description,
                unit = it.unit,
                quantity = it.quantity,
                taxable = roundToTwoDecimals(it.taxable),
                cgst = roundToTwoDecimals(it.cgst),
                sgst = roundToTwoDecimals(it.sgst),
                igst = roundToTwoDecimals(it.igst)
            )
        }
    }
}
