package com.billflow.app.gst

import kotlin.math.roundToInt

object AmountToWords {

    fun toWords(num: Double): String {
        val roundedNum = round(num).toLong()
        if (roundedNum == 0L) return "Zero Rupees Only"

        val single = arrayOf(
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        )
        val double = arrayOf(
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        )

        fun convertLessThanThousand(n: Int): String {
            var temp = n
            var str = ""
            if (temp >= 100) {
                str += single[temp / 100] + " Hundred "
                temp %= 100
            }
            if (temp >= 20) {
                str += double[temp / 10] + " "
                temp %= 10
            }
            if (temp > 0) {
                str += single[temp] + " "
            }
            return str
        }

        var str = ""
        var remaining = roundedNum

        val crore = (remaining / 10000000).toInt()
        remaining %= 10000000
        val lakh = (remaining / 100000).toInt()
        remaining %= 100000
        val thousand = (remaining / 1000).toInt()
        remaining %= 1000

        if (crore > 0) {
            str += convertLessThanThousand(crore) + "Crore "
        }
        if (lakh > 0) {
            str += convertLessThanThousand(lakh) + "Lakh "
        }
        if (thousand > 0) {
            str += convertLessThanThousand(thousand) + "Thousand "
        }
        if (remaining > 0) {
            str += convertLessThanThousand(remaining.toInt())
        }

        return "${str.trim()} Rupees Only"
    }

    private fun round(value: Double): Double {
        return kotlin.math.round(value)
    }
}
