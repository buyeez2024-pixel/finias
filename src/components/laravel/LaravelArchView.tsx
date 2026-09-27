import React, { useState } from 'react';
import {
  Code2,
  Database,
  FileCode,
  Server,
  Layers,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Boxes,
} from 'lucide-react';

export const LaravelArchView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'migrations' | 'models' | 'controllers' | 'schema' | 'composer'>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      const validSubs = ['migrations', 'models', 'controllers', 'schema', 'composer'];
      for (const s of validSubs) {
        if (p.includes(s)) return s as any;
      }
    }
    return 'migrations';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = activeTab === 'migrations' ? '/laravel_arch' : `/laravel_arch/${activeTab}`;
      if (window.location.pathname !== path || window.location.hash) {
        window.history.replaceState(null, '', path);
      }
    }
  }, [activeTab]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const migrationCode = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the finias POS & Enterprise ERP database migrations for MySQL.
     */
    public function up(): void
    {
        // 1. Business Locations / Branches
        Schema::create('locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('city');
            $table->string('state');
            $table->string('country')->default('USA');
            $table->string('zip_code');
            $table->string('phone');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Products Catalog
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sku')->unique();
            $table->string('barcode')->index();
            $table->string('name');
            $table->string('category')->index();
            $table->string('brand');
            $table->string('unit')->default('Pcs');
            $table->decimal('cost_price', 15, 4);
            $table->decimal('selling_price', 15, 4);
            $table->decimal('tax_rate', 5, 2)->default(8.25);
            $table->integer('alert_quantity')->default(5);
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // 3. Location Inventory Pivot (Real-Time Stock)
        Schema::create('location_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignUuid('location_id')->constrained('locations')->onDelete('cascade');
            $table->decimal('quantity', 15, 4)->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'location_id']);
        });

        // 4. Customers & CRM
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('business_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->index();
            $table->text('address')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->decimal('total_due', 15, 2)->default(0);
            $table->integer('loyalty_points')->default(0);
            $table->timestamps();
        });

        // 5. Commercial Transactions (Sales, Purchases, Invoices)
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['sale', 'purchase', 'quotation', 'return']);
            $table->string('invoice_no')->unique();
            $table->foreignUuid('location_id')->constrained('locations');
            $table->foreignUuid('customer_id')->nullable()->constrained('customers');
            $table->uuid('supplier_id')->nullable();
            $table->dateTime('transaction_date');
            $table->decimal('subtotal', 15, 4);
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('discount_amount', 15, 4)->default(0);
            $table->decimal('shipping_charges', 15, 4)->default(0);
            $table->decimal('total_amount', 15, 4);
            $table->decimal('paid_amount', 15, 4)->default(0);
            $table->enum('payment_status', ['paid', 'partial', 'due'])->default('due');
            $table->enum('status', ['final', 'draft', 'received', 'pending'])->default('final');
            $table->string('cashier_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 6. Transaction Line Items
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_price', 15, 4);
            $table->decimal('discount', 15, 4)->default(0);
            $table->decimal('tax', 15, 4)->default(0);
            $table->decimal('total', 15, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('location_stocks');
        Schema::dropIfExists('products');
        Schema::dropIfExists('locations');
    }
};`;

  const modelCode = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;

class Product extends Model
{
    use HasUuids;

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'category',
        'brand',
        'unit',
        'cost_price',
        'selling_price',
        'tax_rate',
        'alert_quantity',
        'description',
        'image_url',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'selling_price' => 'decimal:4',
        'tax_rate' => 'decimal:2',
        'alert_quantity' => 'integer',
    ];

    /**
     * Get multi-branch location stock holdings.
     */
    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'location_stocks')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }

    /**
     * Get total aggregate inventory quantity across all warehouse hubs.
     */
    public function getTotalStockAttribute(): float
    {
        return (float) $this->locations()->sum('location_stocks.quantity');
    }

    /**
     * Transaction line items referencing this SKU.
     */
    public function transactionItems(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }
}`;

  const controllerCode = `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Product;
use App\\Models\\Transaction;
use App\\Models\\Customer;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

class PosController extends Controller
{
    /**
     * Execute POS Checkout with atomic inventory deduction & receipt generation.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'location_id' => 'required|uuid|exists:locations,id',
            'customer_id' => 'required|uuid|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'tendered_amount' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $itemsData = [];

            // 1. Process items and deduct real-time stock
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                // Atomically decrement branch stock
                DB::table('location_stocks')
                    ->where('product_id', $product->id)
                    ->where('location_id', $validated['location_id'])
                    ->decrement('quantity', $item['quantity']);

                $lineTotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => 0,
                    'tax' => ($lineTotal * ($product->tax_rate / 100)),
                    'total' => $lineTotal,
                ];
            }

            $taxRate = 8.25;
            $taxAmount = ($subtotal * $taxRate) / 100;
            $grandTotal = $subtotal + $taxAmount;
            $paidAmount = min($validated['tendered_amount'], $grandTotal);

            // 2. Create invoice record
            $invoice = Transaction::create([
                'type' => 'sale',
                'invoice_no' => 'INV-' . strtoupper(uniqid()),
                'location_id' => $validated['location_id'],
                'customer_id' => $validated['customer_id'],
                'transaction_date' => now(),
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => 0,
                'shipping_charges' => 0,
                'total_amount' => $grandTotal,
                'paid_amount' => $paidAmount,
                'payment_status' => $paidAmount >= $grandTotal ? 'paid' : ($paidAmount > 0 ? 'partial' : 'due'),
                'status' => 'final',
                'cashier_name' => $request->user()->name ?? 'Cashier Admin',
            ]);

            // 3. Attach line items
            $invoice->items()->createMany($itemsData);

            // 4. Update customer loyalty & credit balance
            $customer = Customer::findOrFail($validated['customer_id']);
            $customer->increment('loyalty_points', (int) ($grandTotal / 10));
            if ($grandTotal > $paidAmount) {
                $customer->increment('total_due', ($grandTotal - $paidAmount));
            }

            return response()->json([
                'success' => true,
                'message' => 'POS transaction finalized successfully.',
                'invoice' => $invoice->load(['items.product', 'customer']),
            ], 201);
        });
    }
}`;

  const composerJson = `{
    "name": "finias-pos/laravel-erp-pos",
    "type": "project",
    "description": "Enterprise ERP & POS with Real-Time Multi-Location Inventory & P&L Reporting",
    "require": {
        "php": "^8.3",
        "laravel/framework": "^11.0",
        "laravel/sanctum": "^4.0",
        "doctrine/dbal": "^3.8",
        "maatwebsite/excel": "^3.1",
        "barryvdh/laravel-dompdf": "^2.1",
        "google/gemini-php": "^1.0"
    }
}`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Code2 className="w-5 h-5 text-red-500" />
              <span>Laravel 11 & MySQL ERP Architecture</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              PHP 8.3 Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engineered matching the reference architecture (finias POS / Laravel). Ready to run in production LAMP/LEMP stacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const fullScript = `-- finias POS MySQL Production Database Dump\n-- Laravel 11 / MySQL 8.0 Architecture\n\n${migrationCode}`;
              const blob = new Blob([fullScript], { type: 'text/sql' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'finias_pos_mysql_schema.sql';
              a.click();
            }}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download MySQL Schema</span>
          </button>
        </div>
      </div>

      {/* Code Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('migrations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'migrations' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database Migrations</span>
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'models' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Eloquent Models</span>
        </button>
        <button
          onClick={() => setActiveTab('controllers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'controllers' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>API Controllers</span>
        </button>
        <button
          onClick={() => setActiveTab('composer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'composer' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>composer.json</span>
        </button>
      </div>

      {/* Code Viewer Box */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-slate-300 font-bold">
              {activeTab === 'migrations' && 'database/migrations/2026_01_01_000001_create_ultimate_erp_tables.php'}
              {activeTab === 'models' && 'app/Models/Product.php'}
              {activeTab === 'controllers' && 'app/Http/Controllers/Api/PosController.php'}
              {activeTab === 'composer' && 'composer.json'}
            </span>
          </div>

          <button
            onClick={() => {
              const code =
                activeTab === 'migrations'
                  ? migrationCode
                  : activeTab === 'models'
                  ? modelCode
                  : activeTab === 'controllers'
                  ? controllerCode
                  : composerJson;
              handleCopy(code, activeTab);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
          >
            {copiedKey === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === activeTab ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed">
            {activeTab === 'migrations' && migrationCode}
            {activeTab === 'models' && modelCode}
            {activeTab === 'controllers' && controllerCode}
            {activeTab === 'composer' && composerJson}
          </pre>
        </div>
      </div>
    </div>
  );
};
