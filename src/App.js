import React, { useState, useEffect, use } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, FileText, Calendar, Search, Download, Edit2, Trash2 } from 'lucide-react';
const XLSX = require('xlsx');

const TreasurySystem = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para almacenar datos
  const [monthlyData, setMonthlyData] = useState(() => {
    const savedData = localStorage.getItem('treasury-data');
    return savedData ? JSON.parse(savedData) : {};
  });
  const [showIncomeModal, setShowIncomeModal] = useState(() => {
    const savedData = localStorage.getItem('showIncomeModal');
    return savedData ? JSON.parse(savedData) : false;
  })
  const [showExpenseModal, setShowExpenseModal] = useState(() => {
    const savedData = localStorage.getItem('showExpenseModal');
    return savedData ? JSON.parse(savedData) : false;
  });

  // Save data in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('treasury-data', JSON.stringify(monthlyData));
  }, [monthlyData]);
  
  // Formularios
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    description: '',
    category: 'Ofrendas'
  });
  
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'Actividades'
  });
  
  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    category: ''
  });

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const incomeCategories = [
    'Ofrendas', 'Donaciones', 'Actividades', 'Ventas', 'Otros'
  ];

  const expenseCategories = [
    'Actividades', 'Material', 'Transporte', 'Alimentos', 
    'Equipos', 'Donaciones', 'Mantenimiento', 'Otros'
  ];

  // Obtener clave del mes actual
  const getCurrentMonthKey = () => `${currentYear}-${currentMonth}`;
  
  // Obtener clave del mes anterior
  const getPreviousMonthKey = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return `${prevYear}-${prevMonth}`;
  };

  // Inicializar datos del mes si no existen
  const initializeMonth = (monthKey) => {
    if (!monthlyData[monthKey]) {
      // Calcular el saldo inicial basado en el mes anterior
      const [year, month] = monthKey.split('-').map(Number);
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevKey = `${prevYear}-${prevMonth}`;
      
      let initialBalance = 0;
      if (monthlyData[prevKey]) {
        const prevData = monthlyData[prevKey];
        const prevTotalIncome = prevData.incomes.reduce((sum, income) => sum + income.amount, 0);
        const prevTotalExpenses = prevData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        initialBalance = (prevData.initialBalance || 0) + prevTotalIncome - prevTotalExpenses;
      }
      
      setMonthlyData(prev => ({
        ...prev,
        [monthKey]: {
          incomes: [],
          expenses: [],
          initialBalance: initialBalance
        }
      }));
    }
  };

  // Calcular saldo anterior
  const getPreviousBalance = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevKey = `${prevYear}-${prevMonth}`;
    
    const prevData = monthlyData[prevKey];
    if (!prevData) return 0;
    
    const totalIncome = prevData.incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = prevData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // El saldo anterior es: saldo inicial del mes anterior + ingresos - egresos
    const prevInitialBalance = prevData.initialBalance || 0;
    return prevInitialBalance + totalIncome - totalExpenses;
  };

  // Calcular totales del mes actual
  const getCurrentMonthTotals = () => {
    const currentKey = getCurrentMonthKey();
    const currentData = monthlyData[currentKey] || { incomes: [], expenses: [] };
    
    const totalIncome = currentData.incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = currentData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const previousBalance = getPreviousBalance();
    const currentBalance = previousBalance + totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, currentBalance, previousBalance };
  };

  // Agregar ingreso
  const addIncome = () => {
    const amount = parseFloat(incomeForm.amount);
    if (!amount || amount <= 0 || !incomeForm.description.trim()) return;
    
    const currentKey = getCurrentMonthKey();
    initializeMonth(currentKey);
    
    const newIncome = {
      id: Date.now(),
      amount,
      description: incomeForm.description.trim(),
      category: incomeForm.category,
      date: new Date().toLocaleDateString()
    };
    
    setMonthlyData(prev => ({
      ...prev,
      [currentKey]: {
        ...prev[currentKey],
        incomes: [...(prev[currentKey]?.incomes || []), newIncome]
      }
    }));
    
    setIncomeForm({ amount: '', description: '', category: 'Ofrendas' });
    setShowIncomeModal(false);
  };

  // Agregar egreso
  const addExpense = () => {
    const amount = parseFloat(expenseForm.amount);
    if (!amount || amount <= 0 || !expenseForm.description.trim()) return;
    
    const currentKey = getCurrentMonthKey();
    initializeMonth(currentKey);
    
    const newExpense = {
      id: Date.now(),
      amount,
      description: expenseForm.description.trim(),
      category: expenseForm.category,
      date: new Date().toLocaleDateString()
    };
    
    setMonthlyData(prev => ({
      ...prev,
      [currentKey]: {
        ...prev[currentKey],
        expenses: [...(prev[currentKey]?.expenses || []), newExpense]
      }
    }));
    
    setExpenseForm({ amount: '', description: '', category: 'Actividades' });
    setShowExpenseModal(false);
  };

  // Eliminar transacción
  const deleteTransaction = (transactionId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) return;
    
    const currentKey = getCurrentMonthKey();
    setMonthlyData(prev => {
      const currentData = prev[currentKey] || { incomes: [], expenses: [] };
      return {
        ...prev,
        [currentKey]: {
          ...currentData,
          incomes: currentData.incomes.filter(income => income.id !== transactionId),
          expenses: currentData.expenses.filter(expense => expense.id !== transactionId)
        }
      };
    });
  };

  // Abrir modal de edición
  const openEditModal = (transaction) => {
    const currentKey = getCurrentMonthKey();
    const currentData = monthlyData[currentKey] || { incomes: [], expenses: [] };
    const isIncome = currentData.incomes.some(income => income.id === transaction.id);
    
    setEditingTransaction({ ...transaction, isIncome });
    setEditForm({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category
    });
    setShowEditModal(true);
  };

  // Guardar edición
  const saveEdit = () => {
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0 || !editForm.description.trim()) return;
    
    const currentKey = getCurrentMonthKey();
    const updatedTransaction = {
      ...editingTransaction,
      amount,
      description: editForm.description.trim(),
      category: editForm.category,
      date: editingTransaction.date // Mantener fecha original
    };
    
    setMonthlyData(prev => {
      const currentData = prev[currentKey] || { incomes: [], expenses: [] };
      
      if (editingTransaction.isIncome) {
        return {
          ...prev,
          [currentKey]: {
            ...currentData,
            incomes: currentData.incomes.map(income => 
              income.id === editingTransaction.id ? updatedTransaction : income
            )
          }
        };
      } else {
        return {
          ...prev,
          [currentKey]: {
            ...currentData,
            expenses: currentData.expenses.map(expense => 
              expense.id === editingTransaction.id ? updatedTransaction : expense
            )
          }
        };
      }
    });
    
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditForm({ amount: '', description: '', category: '' });
  };
  const filterTransactions = (transactions) => {
    if (!searchTerm) return transactions;
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Generar reporte detallado
  // Generar reporte en Excel
const generateReport = () => {
  const { totalIncome, totalExpenses, currentBalance, previousBalance } = getCurrentMonthTotals();
  const currentKey = getCurrentMonthKey();
  const currentData = monthlyData[currentKey] || { incomes: [], expenses: [] };
  
  // Crear datos para Excel
  const excelData = [
    ['REPORTE FINANCIERO', `${months[currentMonth]} ${currentYear}`],
    [''],
    ['RESUMEN'],
    ['Saldo Anterior:', `Q${previousBalance.toFixed(2)}`],
    ['Total Ingresos:', `Q${totalIncome.toFixed(2)}`],
    ['Total Egresos:', `Q${totalExpenses.toFixed(2)}`],
    ['Saldo Actual:', `Q${currentBalance.toFixed(2)}`],
    [''],
    ['DETALLE DE INGRESOS'],
    ['Fecha', 'Categoría', 'Descripción', 'Monto'],
    ...currentData.incomes.map(income => [
      income.date, income.category, income.description, income.amount
    ]),
    [''],
    ['DETALLE DE EGRESOS'],
    ['Fecha', 'Categoría', 'Descripción', 'Monto'],
    ...currentData.expenses.map(expense => [
      expense.date, expense.category, expense.description, expense.amount
    ])
  ];

  // Crear y descargar Excel
  const XLSX = require('xlsx');
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `Reporte_${months[currentMonth]}_${currentYear}.xlsx`);
};

  const { totalIncome, totalExpenses, currentBalance, previousBalance } = getCurrentMonthTotals();
  const currentKey = getCurrentMonthKey();
  const currentData = monthlyData[currentKey] || { incomes: [], expenses: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sistema de Tesorería</h1>
              <p className="text-gray-600">Ministerio Juvenil</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <select 
                  value={currentMonth} 
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                <select 
                  value={currentYear} 
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={generateReport}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Generar Reporte
              </button>
              <button
              onClick={() => {
                const dataStr = JSON.stringify(monthlyData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Respaldo_Tesoreria_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Respaldar Datos
            </button>
            {/* Área para importar respaldo */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">Importar Respaldo</h3>
                  <p className="text-sm text-yellow-700">Selecciona un archivo de respaldo (.json)</p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const data = JSON.parse(event.target?.result);
                          if (window.confirm('¿Importar este respaldo?')) {
                            setMonthlyData(data);
                            alert('Datos importados exitosamente');
                          }
                        } catch (error) {
                          alert('Error al leer el archivo.');
                        }
                      };
                      reader.readAsText(file);
                    }
                    e.target.value = '';
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Saldo Anterior</p>
                <p className="text-2xl font-bold text-gray-800">Q{previousBalance.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ingresos</p>
                <p className="text-2xl font-bold text-green-600">Q{totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Egresos</p>
                <p className="text-2xl font-bold text-red-600">Q{totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Saldo Actual</p>
                <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Q{currentBalance.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'dashboard', label: 'Panel Principal', icon: DollarSign },
              { key: 'transactions', label: 'Transacciones', icon: FileText }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === key 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido Principal */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Botones de Acción */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
              <div className="space-y-4">
                <button
                  onClick={() => setShowIncomeModal(true)}
                  className="w-full flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Registrar Ingreso</span>
                </button>
                
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="w-full flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Registrar Egreso</span>
                </button>
                {/* clean all data */}
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que deseas limpiar todos los datos?')) {
                      localStorage.removeItem('treasury-data');
                      setMonthlyData({});
                    }
                  }}
                  className="w-full flex items-center gap-3 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Limpiar Todos los Datos</span>
                </button>
              </div>
            </div>

            {/* Resumen de Transacciones Recientes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Transacciones Recientes</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...currentData.incomes, ...currentData.expenses]
                  .sort((a, b) => b.id - a.id)
                  .slice(0, 5)
                  .map(transaction => {
                    const isIncome = currentData.incomes.includes(transaction);
                    return (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{transaction.category} • {transaction.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}Q{transaction.amount.toFixed(2)}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(transaction)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {[...currentData.incomes, ...currentData.expenses].length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay transacciones registradas</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Todas las Transacciones</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Descripción</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Monto</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filterTransactions([...currentData.incomes, ...currentData.expenses])
                    .sort((a, b) => b.id - a.id)
                    .map(transaction => {
                      const isIncome = currentData.incomes.includes(transaction);
                      return (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{transaction.date}</td>
                          <td className="py-3 px-4">{transaction.description}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isIncome ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${
                            isIncome ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isIncome ? '+' : '-'}Q{transaction.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openEditModal(transaction)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar transacción"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteTransaction(transaction.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar transacción"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Ingresos */}
        {showIncomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Registrar Ingreso</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                  <input
                    type="number"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm(prev => ({...prev, amount: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Ofrenda del domingo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={incomeForm.category}
                    onChange={(e) => setIncomeForm(prev => ({...prev, category: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {incomeCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addIncome}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Agregar Ingreso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Egresos */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Registrar Egreso</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({...prev, amount: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Compra de materiales para actividad"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({...prev, category: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addExpense}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Agregar Egreso
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de Edición */}
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Editar {editingTransaction.isIncome ? 'Ingreso' : 'Egreso'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm(prev => ({...prev, amount: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción de la transacción"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({...prev, category: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(editingTransaction.isIncome ? incomeCategories : expenseCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                    setEditForm({ amount: '', description: '', category: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasurySystem;