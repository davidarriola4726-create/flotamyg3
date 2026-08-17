import React, { useState } from 'react';
import { 
  Code, Copy, Check, Download, Smartphone, 
  Layers, FileCode, CheckCircle2, Terminal, Play, ShieldCheck 
} from 'lucide-react';

interface AndroidFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}

const ANDROID_FILES: AndroidFile[] = [
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/mig/vehiculos/MainActivity.kt',
    language: 'kotlin',
    description: 'Punto de entrada principal con Material 3, autenticación con contraseña MIG2026 y navegación.',
    content: `package com.mig.vehiculos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mig.vehiculos.ui.theme.MIGVehicleControlTheme
import com.mig.vehiculos.ui.screens.*
import com.mig.vehiculos.viewmodel.VehicleViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: VehicleViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MIGVehicleControlTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var isAuthenticated by remember { mutableStateOf(false) }

                    if (!isAuthenticated) {
                        LoginScreen(
                            onLoginSuccess = { isAuthenticated = true }
                        )
                    } else {
                        MainAppNavigation(
                            viewModel = viewModel,
                            onLogout = { isAuthenticated = false }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MainAppNavigation(
    viewModel: VehicleViewModel,
    onLogout: () -> Unit
) {
    val navController = rememberNavController()

    Scaffold(
        bottomBar = {
            MIGBottomNavigation(navController = navController)
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "vehicles",
            modifier = Modifier.padding(paddingValues)
        ) {
            composable("vehicles") {
                VehiclesScreen(viewModel = viewModel, onSelectPlate = { plate ->
                    navController.navigate("vehicle_detail/$plate")
                })
            }
            composable("vehicle_detail/{plate}") { backStackEntry ->
                val plate = backStackEntry.arguments?.getString("plate") ?: ""
                VehicleDetailSubfolderScreen(
                    plate = plate,
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() }
                )
            }
            composable("alerts") {
                AlertsScreen(viewModel = viewModel)
            }
            composable("fuel") {
                FuelControlScreen(viewModel = viewModel)
            }
            composable("spare_parts") {
                SparePartsScreen(viewModel = viewModel)
            }
            composable("field_work") {
                FieldWorkScreen(viewModel = viewModel)
            }
            composable("reports") {
                ReportsScreen(viewModel = viewModel)
            }
            composable("sync_backup") {
                SyncBackupScreen(viewModel = viewModel, onLogout = onLogout)
            }
        }
    }
}`
  },
  {
    name: 'RoomDatabase.kt',
    path: 'app/src/main/java/com/mig/vehiculos/data/local/AppDatabase.kt',
    language: 'kotlin',
    description: 'Entidades SQLite / Room y DAOs para funcionamiento 100% offline.',
    content: `package com.mig.vehiculos.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// Entidad de Vehículo por Placa Única
@Entity(tableName = "vehicles")
data class VehicleEntity(
    @PrimaryKey val plate: String,
    val brand: String,
    val model: String,
    val year: Int,
    val color: String,
    val type: String,
    val assignedDriver: String,
    val driverPhone: String?,
    val currentMileage: Int,
    val fuelType: String,
    val fuelTankCapacityGal: Double,
    val nextServiceDate: String?,
    val nextServiceMileage: Int,
    val status: String
)

// Entidad de Registro de Combustible en Quetzales (Q)
@Entity(
    tableName = "fuel_logs",
    foreignKeys = [
        ForeignKey(
            entity = VehicleEntity::class,
            parentColumns = ["plate"],
            childColumns = ["vehiclePlate"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class FuelLogEntity(
    @PrimaryKey val id: String,
    val vehiclePlate: String,
    val date: String,
    val mileage: Int,
    val gallons: Double,
    val pricePerGallonQ: Double,
    val totalCostQ: Double,
    val fuelType: String,
    val gasStation: String,
    val driverName: String,
    val invoiceNumber: String?
)

// Entidad de Hoja de Trabajo de Campo con Firmas Digitales
@Entity(tableName = "field_work_sheets")
data class FieldWorkSheetEntity(
    @PrimaryKey val id: String,
    val folio: String,
    val clientOrProjectName: String,
    val date: String,
    val workType: String,
    val locationDepartment: String,
    val locationDetails: String,
    val assignedPlate: String,
    val driverName: String,
    val technicianName: String,
    val startMileage: Int,
    val endMileage: Int,
    val totalDistanceKm: Int,
    val descriptionOfWork: String,
    val driverSignatureBase64: String?,
    val technicianSignatureBase64: String?
)

@Dao
interface VehicleDao {
    @Query("SELECT * FROM vehicles ORDER BY plate ASC")
    fun getAllVehicles(): Flow<List<VehicleEntity>>

    @Query("SELECT * FROM vehicles WHERE plate = :plate")
    suspend fun getVehicleByPlate(plate: String): VehicleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVehicle(vehicle: VehicleEntity)

    @Update
    suspend fun updateVehicle(vehicle: VehicleEntity)

    @Query("UPDATE vehicles SET currentMileage = :newMileage WHERE plate = :plate")
    suspend fun updateMileage(plate: String, newMileage: Int)
}

@Dao
interface FuelDao {
    @Query("SELECT * FROM fuel_logs WHERE vehiclePlate = :plate ORDER BY date DESC")
    fun getFuelLogsForPlate(plate: String): Flow<List<FuelLogEntity>>

    @Query("SELECT SUM(totalCostQ) FROM fuel_logs WHERE date LIKE :monthPrefix || '%'")
    suspend fun getMonthlyTotalQ(monthPrefix: String): Double?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFuelLog(log: FuelLogEntity)
}

@Database(
    entities = [
        VehicleEntity::class,
        FuelLogEntity::class,
        FieldWorkSheetEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun vehicleDao(): VehicleDao
    abstract fun fuelDao(): FuelDao
}`
  },
  {
    name: 'VehicleViewModel.kt',
    path: 'app/src/main/java/com/mig/vehiculos/viewmodel/VehicleViewModel.kt',
    language: 'kotlin',
    description: 'Gestor de estado, cálculo de alertas de servicio y sincronización con Firestore.',
    content: `package com.mig.vehiculos.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mig.vehiculos.data.local.AppDatabase
import com.mig.vehiculos.data.local.VehicleEntity
import com.mig.vehiculos.data.local.FuelLogEntity
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.temporal.ChronoUnit

enum class AlertLevel { OK, WARNING, DANGER }

data class VehicleAlert(
    val vehicle: VehicleEntity,
    val level: AlertLevel,
    val daysRemaining: Long,
    val kmRemaining: Int,
    val reason: String
)

class VehicleViewModel(application: Application) : AndroidViewModel(application) {
    private val db = Room.databaseBuilder(
        application,
        AppDatabase::class.java,
        "mig_fleet.db"
    ).build()

    private val firestore = FirebaseFirestore.getInstance()

    val vehicles: StateFlow<List<VehicleEntity>> = db.vehicleDao().getAllVehicles()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Alertas calculadas: 🟢 Al día, 🟡 Próximo (<=30d / <=500km), 🔴 Vencido
    val serviceAlerts: StateFlow<List<VehicleAlert>> = vehicles.map { list ->
        list.map { v ->
            val today = LocalDate.now()
            val targetDate = try { LocalDate.parse(v.nextServiceDate) } catch (e: Exception) { today.plusDays(90) }
            val daysDiff = ChronoUnit.DAYS.between(today, targetDate)
            val kmDiff = v.nextServiceMileage - v.currentMileage

            val level = when {
                daysDiff <= 0 || kmDiff <= 0 -> AlertLevel.DANGER
                daysDiff <= 30 || kmDiff <= 500 -> AlertLevel.WARNING
                else -> AlertLevel.OK
            }

            val reason = when (level) {
                AlertLevel.DANGER -> "Servicio vencido (excedido por fecha o km)"
                AlertLevel.WARNING -> "Próximo servicio en \${daysDiff} días / \${kmDiff} km"
                AlertLevel.OK -> "Al día (\${daysDiff} días restantes)"
            }

            VehicleAlert(v, level, daysDiff, kmDiff, reason)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addFuelLog(log: FuelLogEntity) {
        viewModelScope.launch {
            db.fuelDao().insertFuelLog(log)
            // Sincronizar en Firebase Firestore
            firestore.collection("fuel_logs").document(log.id).set(log)
        }
    }

    fun completeServiceAndReschedule(plate: String, currentMileage: Int) {
        viewModelScope.launch {
            val nextKm = currentMileage + 5000
            val nextDate = LocalDate.now().plusMonths(3).toString()
            val existing = db.vehicleDao().getVehicleByPlate(plate) ?: return@launch

            val updated = existing.copy(
                currentMileage = currentMileage,
                nextServiceMileage = nextKm,
                nextServiceDate = nextDate
            )
            db.vehicleDao().updateVehicle(updated)
            firestore.collection("vehicles").document(plate).set(updated)
        }
    }
}`
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Configuración Gradle con Kotlin Compose BOM, Room, Firebase Firestore y Material 3.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.google.services)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.mig.vehiculos"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mig.vehiculos"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)

    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Room Database SQLite
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Firebase Firestore
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-firestore-ktx")

    // Coroutines & Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
}`
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Manifiesto de la aplicación con permisos de red, almacenamiento y orientación.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="Control de Vehículos MIG"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MIGVehicleControl"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.MIGVehicleControl"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  }
];

export const AndroidCodeView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = ANDROID_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadAll = () => {
    const text = ANDROID_FILES.map(f => `// File: ${f.path}\n\n${f.content}\n\n${'='.repeat(60)}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MIG_Control_Vehiculos_Android_Kotlin_Source.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Código Nativo Android en Kotlin + Jetpack Compose</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Arquitectura moderna MVVM con Room Database (SQLite offline), Firebase Firestore sync, Material 3 y exportador PDF.
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Código Android</span>
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Sidebar file explorer */}
        <div className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Estructura del Proyecto Android
          </div>
          {ANDROID_FILES.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => setSelectedFileIndex(idx)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                selectedFileIndex === idx
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="truncate text-slate-200">{file.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-xs font-bold text-emerald-400 block truncate">
                {currentFile.path}
              </span>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {currentFile.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <pre className="p-4 sm:p-6 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
            <code>{currentFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
