import math
from typing import List

class MetricsService:
    @staticmethod
    def calculate_mae(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        return round(sum(abs(t - p) for t, p in zip(y_true, y_pred)) / len(y_true), 2)

    @staticmethod
    def calculate_rmse(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        mse = sum((t - p) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)
        return round(math.sqrt(mse), 2)

    @staticmethod
    def calculate_mape(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred):
            return 0.0
        # Avoid division by zero
        non_zero = [(t, p) for t, p in zip(y_true, y_pred) if t != 0]
        if not non_zero:
            return 0.0
        return round((sum(abs(t - p) / abs(t) for t, p in non_zero) / len(non_zero)) * 100.0, 2)

    @staticmethod
    def calculate_r2(y_true: List[float], y_pred: List[float]) -> float:
        if not y_true or len(y_true) != len(y_pred) or len(y_true) < 2:
            return 0.0
        mean_true = sum(y_true) / len(y_true)
        ss_res = sum((t - p) ** 2 for t, p in zip(y_true, y_pred))
        ss_tot = sum((t - mean_true) ** 2 for t in y_true)
        if ss_tot == 0.0:
            return 1.0
        return round(1.0 - (ss_res / ss_tot), 3)

    @staticmethod
    def calculate_classification_metrics(y_true_cls: List[int], y_pred_cls: List[int]) -> dict:
        """
        Calculates Accuracy, Precision, Recall, and F1 Score.
        """
        if not y_true_cls or len(y_true_cls) != len(y_pred_cls):
            return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0}
            
        tp = sum(1 for t, p in zip(y_true_cls, y_pred_cls) if t == 1 and p == 1)
        fp = sum(1 for t, p in zip(y_true_cls, y_pred_cls) if t == 0 and p == 1)
        fn = sum(1 for t, p in zip(y_true_cls, y_pred_cls) if t == 1 and p == 0)
        tn = sum(1 for t, p in zip(y_true_cls, y_pred_cls) if t == 0 and p == 0)
        
        acc = (tp + tn) / len(y_true_cls)
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        return {
            "accuracy": round(acc * 100.0, 1),
            "precision": round(prec * 100.0, 1),
            "recall": round(rec * 100.0, 1),
            "f1_score": round(f1 * 100.0, 1)
        }
