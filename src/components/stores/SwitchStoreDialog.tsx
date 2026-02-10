import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";

interface Props {
  storeId: string;
  storeName: string;
  open: boolean;
  onClose: () => void;
}

export function SwitchStoreDialog({
  storeId,
  storeName,
  open,
  onClose,
}: Props) {
  const { switchStoreWithPassword } = useStores();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password) return;

    setLoading(true);
    try {
      await switchStoreWithPassword(storeId, password);
      toast.success(`Adega "${storeName}" selecionada`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Senha inválida");
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar troca de adega</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Senha do usuário</Label>
          <Input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Validando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
