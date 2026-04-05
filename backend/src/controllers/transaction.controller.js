import Transaction from "../models/transaction.model.js";

/**
 * Build a Mongoose filter object from query params.
 * Supported filters: type, category, startDate, endDate
 */
const buildFilter = (query) => {
  const filter = {};

  if (query.type) {
    if (!["income", "expense"].includes(query.type)) {
      throw new Error("Invalid type. Must be 'income' or 'expense'.");
    }
    filter.type = query.type;
  }

  if (query.category) {
    filter.category = { $regex: query.category, $options: "i" };
  }

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (isNaN(start)) throw new Error("Invalid startDate format.");
      filter.date.$gte = start;
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (isNaN(end)) throw new Error("Invalid endDate format.");
      // Include the full end day
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  return filter;
};

// Accessible by: all logged in users (user, analyst, admin)
export const getDashboardData = async (req, res) => {
  try {
    const summary = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };

    for (const entry of summary) {
      if (entry._id === "income") {
        result.income = entry.total;
        result.incomeCount = entry.count;
      } else if (entry._id === "expense") {
        result.expense = entry.total;
        result.expenseCount = entry.count;
      }
    }

    result.netBalance = result.income - result.expense;
    result.totalTransactions = result.incomeCount + result.expenseCount;

    // Latest 5 transactions for a recent activity preview
    result.recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(5)
      .select("amount type category date notes");

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    const transactions = await Transaction.find(filter)
      .populate("createdBy", "fullName userName email")
      .sort({ date: -1 });

    res.status(200).json({ data: transactions });
  } catch (error) {
    const isValidationError = error.message.startsWith("Invalid");
    res
      .status(isValidationError ? 400 : 500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// GET /api/transactions/:id
// Accessible by: analyst, admin
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "createdBy",
      "fullName userName email"
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error in getTransactionById:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/transactions/summary
// Accessible by: analyst, admin
// Returns total income, total expense, net balance
// Supports the same filters as getAllTransactions
export const getTransactionSummary = async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };

    for (const entry of summary) {
      if (entry._id === "income") {
        result.income = entry.total;
        result.incomeCount = entry.count;
      } else if (entry._id === "expense") {
        result.expense = entry.total;
        result.expenseCount = entry.count;
      }
    }

    result.netBalance = result.income - result.expense;
    result.totalTransactions = result.incomeCount + result.expenseCount;

    res.status(200).json(result);
  } catch (error) {
    const isValidationError = error.message.startsWith("Invalid");
    res
      .status(isValidationError ? 400 : 500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// POST /api/transactions
// Accessible by: admin only
export const createTransaction = async (req, res) => {
  const { amount, type, category, date, notes } = req.body;

  if (!amount || !type || !category) {
    return res
      .status(400)
      .json({ message: "amount, type, and category are required." });
  }

  if (!["income", "expense"].includes(type)) {
    return res
      .status(400)
      .json({ message: "type must be 'income' or 'expense'." });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res
      .status(400)
      .json({ message: "amount must be a positive number." });
  }

  if (date && isNaN(new Date(date))) {
    return res.status(400).json({ message: "Invalid date format." });
  }

  try {
    const transaction = new Transaction({
      amount,
      type,
      category: category.trim(),
      date: date ? new Date(date) : Date.now(),
      notes: notes?.trim() || "",
      createdBy: req.user._id,
    });

    const saved = await transaction.save();
    await saved.populate("createdBy", "fullName userName email");

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error in createTransaction:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATCH /api/transactions/:id
// Accessible by: admin only
export const updateTransaction = async (req, res) => {
  const { amount, type, category, date, notes } = req.body;
  const updates = {};

  if (amount !== undefined) {
    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be a positive number." });
    }
    updates.amount = amount;
  }

  if (type !== undefined) {
    if (!["income", "expense"].includes(type)) {
      return res
        .status(400)
        .json({ message: "type must be 'income' or 'expense'." });
    }
    updates.type = type;
  }

  if (category !== undefined) {
    updates.category = category.trim();
  }

  if (date !== undefined) {
    const parsed = new Date(date);
    if (isNaN(parsed)) {
      return res.status(400).json({ message: "Invalid date format." });
    }
    updates.date = parsed;
  }

  if (notes !== undefined) {
    updates.notes = notes.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No valid fields provided for update." });
  }

  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("createdBy", "fullName userName email");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error in updateTransaction:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// DELETE /api/transactions/:id
// Accessible by: admin only
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error in deleteTransaction:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
