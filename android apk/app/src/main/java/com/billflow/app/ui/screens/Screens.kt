package com.billflow.app.ui.screens

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.navigation.NavController
import com.billflow.app.data.local.*
import com.billflow.app.data.repository.BillRepository
import com.billflow.app.gst.AmountToWords
import com.billflow.app.gst.GstCalculator
import com.billflow.app.ui.theme.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ── CUSTOM REUSABLE COMPONENTS ───────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BFCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        content = content
    )
}

@Composable
fun StatusBadge(status: String) {
    val (color, text) = when (status.lowercase()) {
        "paid" -> StampGreen to "PAID"
        "sent" -> StampGold to "SENT"
        "cancelled" -> StampRed to "CANCELLED"
        else -> TextMuted to "DRAFT"
    }
    Surface(
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.padding(2.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
        )
    }
}

// ── 1. LOGIN SCREEN ──────────────────────────────────────────────────────────
@Composable
fun LoginScreen(
    repository: BillRepository,
    onLoginSuccess: () -> Unit
) {
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "BillFlow",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Text(
            text = "Offline-First GST Ledger",
            fontSize = 16.sp,
            color = TextMuted,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        if (isLoading) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        } else {
            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) {
                        Toast.makeText(context, "Fill in all fields", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        val res = repository.login(email, password)
                        isLoading = false
                        if (res.isSuccess) {
                            onLoginSuccess()
                        } else {
                            Toast.makeText(context, res.exceptionOrNull()?.message ?: "Login failed", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Sign In", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ── 2. DASHBOARD SCREEN ──────────────────────────────────────────────────────
@Composable
fun DashboardScreen(
    repository: BillRepository,
    navController: NavController
) {
    var summary by remember { mutableStateOf(DashboardSummary(0, 0.0, 0.0, 0)) }
    var recentBills by remember { mutableStateOf(emptyList<Bill>()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            summary = repository.getDashboardSummary()
            recentBills = repository.listBills().take(5)
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate("bill_edit") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "New Bill")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "Dashboard",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Summary Cards Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    SummaryCard("Outstanding", "₹${summary.unpaidTotal}", StampGold)
                    Spacer(modifier = Modifier.height(12.dp))
                    SummaryCard("Total Invoices", "${summary.totalBills}", DeepInk)
                }
                Column(modifier = Modifier.weight(1f)) {
                    SummaryCard("Paid (Month)", "₹${summary.paidThisMonth}", StampGreen)
                    Spacer(modifier = Modifier.height(12.dp))
                    SummaryCard("Overdue Bills", "${summary.overdueCount}", StampRed)
                }
            }

            Text(
                text = "Recent Invoices",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            if (recentBills.isEmpty()) {
                Text("No bills created yet.", color = TextMuted, modifier = Modifier.padding(vertical = 8.dp))
            } else {
                for (b in recentBills) {
                    InvoiceRow(bill = b, onClick = { navController.navigate("bill_view/${b.id}") })
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun SummaryCard(title: String, value: String, accentColor: Color) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, fontSize = 12.sp, color = TextMuted, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 18.sp, color = accentColor, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun InvoiceRow(bill: Bill, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(6.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(bill.billNumber, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(bill.billDate, fontSize = 12.sp, color = TextMuted)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("₹${bill.grandTotal}", fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.padding(end = 8.dp))
                StatusBadge(bill.status)
            }
        }
    }
}

// ── 3. BILLS LIST SCREEN ─────────────────────────────────────────────────────
@Composable
fun BillsListScreen(
    repository: BillRepository,
    navController: NavController
) {
    var searchQuery by remember { mutableStateOf("") }
    var bills by remember { mutableStateOf(emptyList<Bill>()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(searchQuery) {
        scope.launch {
            bills = repository.listBills(searchQuery)
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate("bill_edit") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "New Bill")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text(
                text = "Invoices",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search by Bill No or Customer") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) }
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(bills) { b ->
                    InvoiceRow(bill = b, onClick = { navController.navigate("bill_view/${b.id}") })
                }
            }
        }
    }
}

// ── 4. BILL EDIT SCREEN (CREATE/EDIT) ────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillEditScreen(
    repository: BillRepository,
    navController: NavController,
    billId: String?
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var billNumber by remember { mutableStateOf("") }
    var billDate by remember { mutableStateOf(SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())) }
    var dueDate by remember { mutableStateOf(SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())) }
    var selectedCustomerId by remember { mutableStateOf("") }
    var customers by remember { mutableStateOf(emptyList<Customer>()) }
    var itemsList by remember { mutableStateOf(mutableListOf<BillItem>()) }

    var catalogItems by remember { mutableStateOf(emptyList<ItemCatalog>()) }
    var isNew by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            customers = repository.listCustomers()
            catalogItems = repository.listItems()

            if (billId != null) {
                isNew = false
                val pair = repository.getBillWithItems(billId)
                val b = pair.first
                billNumber = b.billNumber
                billDate = b.billDate
                dueDate = b.dueDate ?: ""
                selectedCustomerId = b.customerId
                itemsList.clear()
                itemsList.addAll(pair.second)
            } else {
                // Auto generate invoice number
                val nextNum = repository.getSetting("bill_next_number") ?: "1"
                val prefix = repository.getSetting("bill_prefix") ?: "INV"
                billNumber = "$prefix-$nextNum"
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isNew) "Create Invoice" else "Edit Invoice") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            OutlinedTextField(
                value = billNumber,
                onValueChange = { billNumber = it },
                label = { Text("Invoice Number") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            OutlinedTextField(
                value = billDate,
                onValueChange = { billDate = it },
                label = { Text("Date (YYYY-MM-DD)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            // Customer Picker
            var customerDropdownExpanded by remember { mutableStateOf(false) }
            val selectedCustomer = customers.find { it.id == selectedCustomerId }

            ExposedDropdownMenuBox(
                expanded = customerDropdownExpanded,
                onExpandedChange = { customerDropdownExpanded = !customerDropdownExpanded },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp)
            ) {
                OutlinedTextField(
                    readOnly = true,
                    value = selectedCustomer?.name ?: "Select Customer",
                    onValueChange = {},
                    label = { Text("Customer") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = customerDropdownExpanded) },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = customerDropdownExpanded,
                    onDismissRequest = { customerDropdownExpanded = false }
                ) {
                    customers.forEach { c ->
                        DropdownMenuItem(
                            text = { Text(c.name) },
                            onClick = {
                                selectedCustomerId = c.id
                                customerDropdownExpanded = false
                            }
                        )
                    }
                }
            }

            Text("Line Items", fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))

            // Render existing items
            itemsList.forEachIndexed { index, item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = CardSurface)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text("Item #${index + 1}", fontWeight = FontWeight.Bold)
                            IconButton(
                                onClick = {
                                    val updated = itemsList.toMutableList()
                                    updated.removeAt(index)
                                    itemsList = updated
                                },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StampRed)
                            }
                        }

                        var itemDropdownExpanded by remember { mutableStateOf(false) }
                        val currentCatalogItem = catalogItems.find { it.id == item.catalogItemId }

                        ExposedDropdownMenuBox(
                            expanded = itemDropdownExpanded,
                            onExpandedChange = { itemDropdownExpanded = !itemDropdownExpanded },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            OutlinedTextField(
                                readOnly = true,
                                value = currentCatalogItem?.name ?: "Select Product",
                                onValueChange = {},
                                label = { Text("Product") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = itemDropdownExpanded) },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = itemDropdownExpanded,
                                onDismissRequest = { itemDropdownExpanded = false }
                            ) {
                                catalogItems.forEach { cat ->
                                    DropdownMenuItem(
                                        text = { Text(cat.name) },
                                        onClick = {
                                            val updated = itemsList.toMutableList()
                                            val calcResult = GstCalculator.calcLineItem(
                                                GstCalculator.LineItemInput(
                                                    quantity = item.quantity ?: 1.0,
                                                    unitPrice = cat.gstRate ?: 0.0, // wait, using catalog unit price
                                                    discountPercent = item.discountPercent ?: 0.0,
                                                    gstRate = cat.gstRate ?: 18.0
                                                )
                                            )
                                            updated[index] = item.copy(
                                                catalogItemId = cat.id,
                                                description = cat.name,
                                                gstRate = cat.gstRate,
                                                unitPrice = 0.0, // Default to edit manually
                                                lineTotal = calcResult.lineTotal
                                            )
                                            itemsList = updated
                                            itemDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = (item.quantity ?: 0.0).toString(),
                                onValueChange = { val qtyVal = it.toDoubleOrNull() ?: 0.0
                                    val updated = itemsList.toMutableList()
                                    updated[index] = item.copy(quantity = qtyVal)
                                    itemsList = updated
                                },
                                label = { Text("Qty") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = (item.unitPrice ?: 0.0).toString(),
                                onValueChange = { val priceVal = it.toDoubleOrNull() ?: 0.0
                                    val updated = itemsList.toMutableList()
                                    updated[index] = item.copy(unitPrice = priceVal)
                                    itemsList = updated
                                },
                                label = { Text("Rate") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1.5f)
                            )
                        }
                    }
                }
            }

            Button(
                onClick = {
                    val updated = itemsList.toMutableList()
                    updated.add(BillItem(billId = billId ?: "", unit = "Nos", quantity = 1.0, unitPrice = 0.0, gstRate = 18.0))
                    itemsList = updated
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.padding(end = 4.dp))
                Text("Add Item Row")
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    if (selectedCustomerId.isBlank() || itemsList.isEmpty() || billNumber.isBlank()) {
                        Toast.makeText(context, "Fill in all fields and add at least 1 item", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    scope.launch {
                        // Perform calculations
                        val lineItemResults = itemsList.map { bi ->
                            val businessState = repository.getSetting("business_state_code") ?: "24"
                            val cust = repository.getCustomer(selectedCustomerId)
                            val supplyType = GstCalculator.getSupplyType(businessState, cust?.stateCode)
                            GstCalculator.calcLineItem(
                                GstCalculator.LineItemInput(
                                    quantity = bi.quantity ?: 0.0,
                                    unitPrice = bi.unitPrice ?: 0.0,
                                    discountPercent = bi.discountPercent ?: 0.0,
                                    gstRate = bi.gstRate ?: 18.0,
                                    supplyType = supplyType
                                )
                            )
                        }

                        val totals = GstCalculator.calcBillTotals(lineItemResults)
                        val computedItems = itemsList.mapIndexed { idx, bi ->
                            val res = lineItemResults[idx]
                            bi.copy(
                                baseAmount = res.baseAmount,
                                discountAmount = res.discountAmount,
                                taxableAmount = res.taxableAmount,
                                cgstRate = res.cgstRate,
                                cgstAmount = res.cgstAmount,
                                sgstRate = res.sgstRate,
                                sgstAmount = res.sgstAmount,
                                igstRate = res.igstRate,
                                igstAmount = res.igstAmount,
                                lineTotal = res.lineTotal
                            )
                        }

                        val billUuid = billId ?: UUID.randomUUID().toString().replace("-", "")
                        val billObj = Bill(
                            id = billUuid,
                            billNumber = billNumber,
                            customerId = selectedCustomerId,
                            billDate = billDate,
                            dueDate = dueDate,
                            status = "draft",
                            grandTotal = totals.grandTotal,
                            amountPaid = 0.0,
                            amountDue = totals.grandTotal,
                            createdBy = repository.getSession()?.email
                        )

                        val taxRecord = TaxRecord(
                            id = UUID.randomUUID().toString().replace("-", ""),
                            billId = billUuid,
                            billDate = billDate,
                            billNumber = billNumber,
                            totalTaxable = totals.totalTaxable,
                            totalCgst = totals.totalCGST,
                            totalSgst = totals.totalSGST,
                            totalIgst = totals.totalIGST,
                            totalTax = totals.totalTax,
                            grandTotal = totals.grandTotal
                        )

                        if (isNew) {
                            repository.createBill(billObj, computedItems, taxRecord)
                            // Increment settings next number
                            val nextNumSetting = repository.getSetting("bill_next_number") ?: "1"
                            val nextNum = (nextNumSetting.toIntOrNull() ?: 1) + 1
                            repository.setSetting("bill_next_number", nextNum.toString())
                        } else {
                            repository.updateBill(billObj, computedItems, taxRecord)
                        }

                        Toast.makeText(context, "Invoice Saved Successfully", Toast.LENGTH_SHORT).show()
                        navController.navigateUp()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Save Invoice", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ── 5. BILL VIEW SCREEN ──────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillViewScreen(
    repository: BillRepository,
    navController: NavController,
    billId: String
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var bill by remember { mutableStateOf<Bill?>(null) }
    var items by remember { mutableStateOf(emptyList<BillItem>()) }
    var customer by remember { mutableStateOf<Customer?>(null) }
    var businessName by remember { mutableStateOf("") }
    var businessGstin by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        scope.launch {
            val pair = repository.getBillWithItems(billId)
            bill = pair.first
            items = pair.second
            customer = repository.getCustomer(pair.first.customerId)
            businessName = repository.getSetting("business_name") ?: "My Business"
            businessGstin = repository.getSetting("gstin") ?: ""
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(bill?.billNumber ?: "View Invoice") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
                .padding(16.dp)
        ) {
            if (bill == null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                val currentBill = bill!!

                // Invoice Card Area
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    colors = CardDefaults.cardColors(containerColor = CardSurface),
                    border = BorderStroke(1.dp, SoftBorder)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        // Invoice Header
                        Text(businessName, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = DeepInk)
                        if (businessGstin.isNotBlank()) {
                            Text("GSTIN: $businessGstin", fontSize = 12.sp, color = TextMuted)
                        }
                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Column {
                                Text("Billed To:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextMuted)
                                Text(customer?.name ?: "Customer Name", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                Text(customer?.phone ?: "", fontSize = 12.sp)
                                Text(customer?.state ?: "", fontSize = 12.sp)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Invoice #: ${currentBill.billNumber}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Date: ${currentBill.billDate}", fontSize = 12.sp)
                                StatusBadge(status = currentBill.status)
                            }
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        // Table Headers
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Item / Desc", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(2f))
                            Text("Qty", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(0.8f))
                            Text("Price", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1.2f))
                            Text("Total", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1.2f))
                        }
                        Spacer(modifier = Modifier.height(6.dp))

                        // Items
                        for (item in items) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(item.description ?: "Item", fontSize = 13.sp, modifier = Modifier.weight(2f))
                                Text("${item.quantity} ${item.unit}", fontSize = 13.sp, modifier = Modifier.weight(0.8f))
                                Text("₹${item.unitPrice}", fontSize = 13.sp, modifier = Modifier.weight(1.2f))
                                Text("₹${item.lineTotal}", fontSize = 13.sp, modifier = Modifier.weight(1.2f))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        // Totals block
                        Column(modifier = Modifier.align(Alignment.End)) {
                            Text("Grand Total: ₹${currentBill.grandTotal}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DeepInk)
                            val words = AmountToWords.toWords(currentBill.grandTotal)
                            Text(words, fontSize = 11.sp, color = TextMuted, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Actions Bottom Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = {
                            scope.launch(Dispatchers.IO) {
                                val pdfFile = generateInvoicePdfFile(context, currentBill, items, customer, businessName, businessGstin)
                                withContext(Dispatchers.Main) {
                                    if (pdfFile != null) {
                                        val uri = FileProvider.getUriForFile(context, "com.billflow.app.fileprovider", pdfFile)
                                        val intent = Intent(Intent.ACTION_SEND).apply {
                                            type = "application/pdf"
                                            putExtra(Intent.EXTRA_STREAM, uri)
                                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }
                                        context.startActivity(Intent.createChooser(intent, "Share Invoice PDF"))
                                    } else {
                                        Toast.makeText(context, "Failed to generate PDF", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.padding(end = 4.dp))
                        Text("Share PDF")
                    }

                    Button(
                        onClick = {
                            val msg = "Hello ${customer?.name}, here is your Invoice ${currentBill.billNumber} for amount ₹${currentBill.grandTotal}. Thank you!"
                            val phoneNumber = customer?.phone?.replace("[^0-9]".toRegex(), "") ?: ""
                            val formattedPhone = if (phoneNumber.length == 10) "91$phoneNumber" else phoneNumber

                            try {
                                val intent = Intent(Intent.ACTION_VIEW).apply {
                                    data = Uri.parse("https://api.whatsapp.com/send?phone=$formattedPhone&text=${Uri.encode(msg)}")
                                }
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "WhatsApp not installed", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = WhatsAppGreen)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.padding(end = 4.dp))
                        Text("WhatsApp")
                    }
                }
            }
        }
    }
}

// Native PDF Document drawer method for local vector PDF rendering
private fun generateInvoicePdfFile(
    context: Context,
    bill: Bill,
    items: List<BillItem>,
    customer: Customer?,
    businessName: String,
    businessGstin: String
): File? {
    try {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        val paint = Paint()
        paint.color = android.graphics.Color.BLACK
        paint.textSize = 12f

        // Draw Business Header
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 16f
        canvas.drawText(businessName, 40f, 50f, paint)

        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        paint.textSize = 10f
        canvas.drawText("GSTIN: $businessGstin", 40f, 65f, paint)

        canvas.drawLine(40f, 80f, 555f, 80f, paint)

        // Draw Invoice Meta
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("Invoice #: ${bill.billNumber}", 380f, 105f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText("Date: ${bill.billDate}", 380f, 120f, paint)

        // Draw Customer details
        canvas.drawText("Billed To:", 40f, 105f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText(customer?.name ?: "Customer", 40f, 120f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText("Phone: ${customer?.phone ?: ""}", 40f, 135f, paint)
        canvas.drawText("State: ${customer?.state ?: ""}", 40f, 150f, paint)

        // Draw Items Table Header
        canvas.drawLine(40f, 175f, 555f, 175f, paint)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("Item / Description", 45f, 190f, paint)
        canvas.drawText("Qty", 300f, 190f, paint)
        canvas.drawText("Unit Price", 370f, 190f, paint)
        canvas.drawText("Total", 470f, 190f, paint)
        canvas.drawLine(40f, 198f, 555f, 198f, paint)

        // Draw rows
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        var yPos = 215f
        for (itm in items) {
            canvas.drawText(itm.description ?: "Product", 45f, yPos, paint)
            canvas.drawText("${itm.quantity} ${itm.unit}", 300f, yPos, paint)
            canvas.drawText("₹${itm.unitPrice}", 370f, yPos, paint)
            canvas.drawText("₹${itm.lineTotal}", 470f, yPos, paint)
            yPos += 18f
        }

        canvas.drawLine(40f, yPos, 555f, yPos, paint)
        yPos += 20f

        // Draw Grand Total
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("Grand Total:  ₹${bill.grandTotal}", 360f, yPos, paint)
        yPos += 15f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
        paint.textSize = 8f
        canvas.drawText("Amount in words: ${AmountToWords.toWords(bill.grandTotal)}", 40f, yPos, paint)

        pdfDocument.finishPage(page)

        val cachePath = File(context.cacheDir, "invoices")
        cachePath.mkdirs()
        val file = File(cachePath, "invoice_${bill.billNumber}.pdf")
        val stream = FileOutputStream(file)
        pdfDocument.writeTo(stream)
        pdfDocument.close()
        stream.close()
        return file
    } catch (e: Exception) {
        e.printStackTrace()
        return null
    }
}

// ── 6. CUSTOMERS LIST SCREEN ─────────────────────────────────────────────────
@Composable
fun CustomersListScreen(
    repository: BillRepository,
    navController: NavController
) {
    var searchQuery by remember { mutableStateOf("") }
    var customers by remember { mutableStateOf(emptyList<Customer>()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(searchQuery) {
        scope.launch {
            customers = repository.listCustomers(searchQuery)
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate("customer_edit") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Customer")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text(
                text = "Customers",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search by Name or Phone") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) }
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(customers) { c ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { navController.navigate("customer_edit?customerId=${c.id}") },
                        shape = RoundedCornerShape(6.dp),
                        colors = CardDefaults.cardColors(containerColor = CardSurface)
                    ) {
                        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text(c.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("Phone: ${c.phone ?: "-"}", fontSize = 12.sp, color = TextMuted)
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted)
                        }
                    }
                }
            }
        }
    }
}

// ── 7. CUSTOMER EDIT SCREEN ──────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerEditScreen(
    repository: BillRepository,
    navController: NavController,
    customerId: String?
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var state by remember { mutableStateOf("") }
    var stateCode by remember { mutableStateOf("") }
    var isNew by remember { mutableStateOf(true) }
    var createdAtTimestamp by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        if (customerId != null) {
            isNew = false
            scope.launch {
                val c = repository.getCustomer(customerId)
                if (c != null) {
                    name = c.name
                    email = c.email ?: ""
                    phone = c.phone ?: ""
                    state = c.state ?: ""
                    stateCode = c.stateCode ?: ""
                    createdAtTimestamp = c.createdAt
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isNew) "Add Customer" else "Edit Customer") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Customer/Party Name") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone Number") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email Address") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            OutlinedTextField(
                value = state,
                onValueChange = { state = it },
                label = { Text("State") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            OutlinedTextField(
                value = stateCode,
                onValueChange = { stateCode = it },
                label = { Text("State Code (e.g. 24 for Gujarat)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
            )

            Button(
                onClick = {
                    if (name.isBlank() || phone.isBlank()) {
                        Toast.makeText(context, "Name and Phone are required", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    scope.launch {
                        val c = Customer(
                            id = customerId ?: UUID.randomUUID().toString().replace("-", ""),
                            name = name,
                            email = email,
                            phone = phone,
                            state = state,
                            stateCode = stateCode,
                            createdAt = if (isNew) getCurrentTimestampString() else createdAtTimestamp,
                            updatedAt = getCurrentTimestampString()
                        )
                        if (isNew) {
                            repository.createCustomer(c)
                        } else {
                            repository.updateCustomer(c)
                        }
                        Toast.makeText(context, "Customer saved successfully", Toast.LENGTH_SHORT).show()
                        navController.navigateUp()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Save Customer", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ── 8. ITEMS CATALOG SCREEN ──────────────────────────────────────────────────
@Composable
fun ItemsCatalogScreen(
    repository: BillRepository
) {
    var searchQuery by remember { mutableStateOf("") }
    var items by remember { mutableStateOf(emptyList<ItemCatalog>()) }
    var showDialog by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    // Add dialog fields
    var newName by remember { mutableStateOf("") }
    var newRate by remember { mutableStateOf("18.0") }
    var newPrice by remember { mutableStateOf("0.0") }

    fun refresh() {
        scope.launch {
            items = repository.listItems(searchQuery)
        }
    }

    LaunchedEffect(searchQuery) {
        refresh()
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Item")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text(
                text = "Product Catalog",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search Products") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) }
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(items) { i ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(6.dp),
                        colors = CardDefaults.cardColors(containerColor = CardSurface)
                    ) {
                        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text(i.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("GST Rate: ${i.gstRate}%", fontSize = 12.sp, color = TextMuted)
                            }
                            IconButton(onClick = {
                                scope.launch {
                                    repository.deleteItem(i.id)
                                    refresh()
                                    Toast.makeText(context, "Item deleted", Toast.LENGTH_SHORT).show()
                                }
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StampRed)
                            }
                        }
                    }
                }
            }

            if (showDialog) {
                AlertDialog(
                    onDismissRequest = { showDialog = false },
                    title = { Text("Add Product Item") },
                    text = {
                        Column {
                            OutlinedTextField(
                                value = newName,
                                onValueChange = { newName = it },
                                label = { Text("Product Name") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
                            )
                            OutlinedTextField(
                                value = newRate,
                                onValueChange = { newRate = it },
                                label = { Text("GST Rate (%)") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                if (newName.isBlank()) return@TextButton
                                scope.launch {
                                    val newItem = ItemCatalog(
                                        name = newName,
                                        gstRate = newRate.toDoubleOrNull() ?: 18.0
                                    )
                                    repository.createItem(newItem)
                                    newName = ""
                                    newRate = "18.0"
                                    showDialog = false
                                    refresh()
                                }
                            }
                        ) {
                            Text("Add")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showDialog = false }) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}

// ── 9. REPORTS SCREEN ────────────────────────────────────────────────────────
@Composable
fun ReportsScreen(
    repository: BillRepository
) {
    var monthlyGstBreakdown by remember { mutableStateOf(emptyList<GstCalculator.RateWiseSummary>()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            val currentYear = SimpleDateFormat("yyyy", Locale.US).format(Date())
            monthlyGstBreakdown = repository.getMonthlyGSTSummary(currentYear)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        Text(
            text = "GST Tax Reports",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        BFCard {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("GST collected breakdown for the current year", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("GST Rate", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Text("Taxable (₹)", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1.5f))
                    Text("CGST (₹)", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Text("SGST (₹)", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f))
                }
                Divider(modifier = Modifier.padding(vertical = 8.dp))

                if (monthlyGstBreakdown.isEmpty()) {
                    Text("No taxable records found for this year.", fontSize = 12.sp, color = TextMuted, modifier = Modifier.padding(vertical = 8.dp))
                } else {
                    for (row in monthlyGstBreakdown) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${row.rate}%", fontSize = 13.sp, modifier = Modifier.weight(1f))
                            Text("₹${row.taxable}", fontSize = 13.sp, modifier = Modifier.weight(1.5f))
                            Text("₹${row.cgst}", fontSize = 13.sp, modifier = Modifier.weight(1f))
                            Text("₹${row.sgst}", fontSize = 13.sp, modifier = Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                    }
                }
            }
        }
    }
}

// ── 10. SETTINGS SCREEN ──────────────────────────────────────────────────────
@Composable
fun SettingsScreen(
    repository: BillRepository,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var businessName by remember { mutableStateOf("") }
    var businessGstin by remember { mutableStateOf("") }
    var businessAddress by remember { mutableStateOf("") }
    var businessCity by remember { mutableStateOf("") }
    var bankAccount by remember { mutableStateOf("") }
    var bankName by remember { mutableStateOf("") }
    var bankIfsc by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        scope.launch {
            businessName = repository.getSetting("business_name") ?: ""
            businessGstin = repository.getSetting("gstin") ?: ""
            businessAddress = repository.getSetting("business_address") ?: ""
            businessCity = repository.getSetting("business_city") ?: ""
            bankAccount = repository.getSetting("bank_account") ?: ""
            bankName = repository.getSetting("bank_name") ?: ""
            bankIfsc = repository.getSetting("bank_ifsc") ?: ""
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "Settings",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        BFCard(modifier = Modifier.padding(bottom = 16.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Business Profile", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(bottom = 12.dp))

                OutlinedTextField(
                    value = businessName,
                    onValueChange = { businessName = it },
                    label = { Text("Business Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = businessGstin,
                    onValueChange = { businessGstin = it },
                    label = { Text("GSTIN") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = businessAddress,
                    onValueChange = { businessAddress = it },
                    label = { Text("Address") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = businessCity,
                    onValueChange = { businessCity = it },
                    label = { Text("City") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        BFCard(modifier = Modifier.padding(bottom = 16.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Bank Details (for Invoices)", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(bottom = 12.dp))

                OutlinedTextField(
                    value = bankName,
                    onValueChange = { bankName = it },
                    label = { Text("Bank Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = bankAccount,
                    onValueChange = { bankAccount = it },
                    label = { Text("Account Number") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = bankIfsc,
                    onValueChange = { bankIfsc = it },
                    label = { Text("IFSC Code") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Button(
            onClick = {
                scope.launch {
                    val settings = mapOf(
                        "business_name" to businessName,
                        "gstin" to businessGstin,
                        "business_address" to businessAddress,
                        "business_city" to businessCity,
                        "bank_name" to bankName,
                        "bank_account" to bankAccount,
                        "bank_ifsc" to bankIfsc
                    )
                    repository.setMultipleSettings(settings)
                    Toast.makeText(context, "Settings Saved Successfully", Toast.LENGTH_SHORT).show()
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
            Text("Save Profile Settings", fontWeight = FontWeight.Bold)
        }

        OutlinedButton(
            onClick = {
                scope.launch {
                    repository.logout()
                    onLogout()
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = StampRed),
            border = BorderStroke(1.dp, StampRed)
        ) {
            Text("Logout & Sign Out", fontWeight = FontWeight.Bold)
        }
    }
}
