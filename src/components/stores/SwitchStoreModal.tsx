import { useState } from "react";
import bcrypt from "bcryptjs";
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
import { Store } from "@/hooks/useStores";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStores } from "@/hooks/useStores";

interface Props {
  store: Store;
  open: boolean;
  onClose: () => void;
}

export function SwitchStoreModal({ store, open, onClose }: Props) {
  const { setCurrentStore } = useStores();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("stores")
      .select("store_password_hash")
      .eq("id", store.id)
      .single();

    if (error || !data?.store_password_hash) {
      toast.error("Adega sem senha configurada");
      setLoading(false);
      return;
    }

    const valid = await bcrypt.compare(
      password,
      data.store_password_hash
    );

    if (!valid) {
      toast.error("Senha incorreta");
      setLoading(false);
      return;
    }

    await setCurrentStore(store);

    toast.success(`Adega "${store.name}" selecionada`);
    setPassword("");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trocar de Adega</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Digite a senha da adega <b>{store.name}</b>
          </p>

          <div className="space-y-2">
            <Label>Senha da adega</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Verificando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
