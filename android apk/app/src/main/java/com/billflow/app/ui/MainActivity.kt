package com.billflow.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.billflow.app.data.repository.BillRepository
import com.billflow.app.ui.screens.*
import com.billflow.app.ui.theme.BillFlowTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repository = BillRepository(applicationContext)

        setContent {
            var isLoggedIn by remember { mutableStateOf(false) }
            var checkedLogin by remember { mutableStateOf(false) }

            // Check login state on startup
            LaunchedEffect(Unit) {
                isLoggedIn = repository.isLoggedIn()
                checkedLogin = true
            }

            if (checkedLogin) {
                BillFlowTheme {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        AppNavigation(
                            repository = repository,
                            initialIsLoggedIn = isLoggedIn,
                            onLoginStateChanged = { isLoggedIn = it }
                        )
                    }
                }
            } else {
                // Show simple loading splash while checking login
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(
                        contentAlignment = androidx.compose.ui.Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
    }
}

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Home", Icons.Default.Home)
    object Bills : Screen("bills", "Bills", Icons.Default.Description)
    object Customers : Screen("customers", "Customers", Icons.Default.People)
    object Items : Screen("items", "Items", Icons.Default.ShoppingCart)
    object Reports : Screen("reports", "Reports", Icons.Default.BarChart)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(
    repository: BillRepository,
    initialIsLoggedIn: Boolean,
    onLoginStateChanged: (Boolean) -> Unit
) {
    val navController = rememberNavController()
    var isLoggedInState by remember { mutableStateOf(initialIsLoggedIn) }

    val items = listOf(
        Screen.Dashboard,
        Screen.Bills,
        Screen.Customers,
        Screen.Items,
        Screen.Reports,
        Screen.Settings
    )

    Scaffold(
        bottomBar = {
            if (isLoggedInState) {
                NavigationBar {
                    val navBackStackEntry by navController.currentBackStackEntryAsState()
                    val currentRoute = navBackStackEntry?.destination?.route
                    items.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                            selected = currentRoute?.startsWith(screen.route) == true,
                            onClick = {
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.startDestinationId) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        );
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (isLoggedInState) Screen.Dashboard.route else "login",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("login") {
                LoginScreen(
                    repository = repository,
                    onLoginSuccess = {
                        isLoggedInState = true
                        onLoginStateChanged(true)
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    repository = repository,
                    navController = navController
                )
            }
            composable(Screen.Bills.route) {
                BillsListScreen(
                    repository = repository,
                    navController = navController
                )
            }
            composable("bill_edit?billId={billId}") { backStackEntry ->
                val billId = backStackEntry.arguments?.getString("billId")
                BillEditScreen(
                    repository = repository,
                    navController = navController,
                    billId = billId
                )
            }
            composable("bill_view/{billId}") { backStackEntry ->
                val billId = backStackEntry.arguments?.getString("billId") ?: ""
                BillViewScreen(
                    repository = repository,
                    navController = navController,
                    billId = billId
                )
            }
            composable(Screen.Customers.route) {
                CustomersListScreen(
                    repository = repository,
                    navController = navController
                )
            }
            composable("customer_edit?customerId={customerId}") { backStackEntry ->
                val customerId = backStackEntry.arguments?.getString("customerId")
                CustomerEditScreen(
                    repository = repository,
                    navController = navController,
                    customerId = customerId
                )
            }
            composable(Screen.Items.route) {
                ItemsCatalogScreen(
                    repository = repository
                )
            }
            composable(Screen.Reports.route) {
                ReportsScreen(
                    repository = repository
                )
            }
            composable(Screen.Settings.route) {
                SettingsScreen(
                    repository = repository,
                    onLogout = {
                        isLoggedInState = false
                        onLoginStateChanged(false)
                        navController.navigate("login") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
