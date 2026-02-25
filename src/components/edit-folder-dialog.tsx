"use client";

import { useState, useCallback, type FormEvent } from "react";
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
import { Separator } from "@/components/ui/separator";
import { EmojiPicker } from "@/components/emoji-picker";
import { Loader2, Eye, EyeOff, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderData {
  id: number;
  name: string;
  emoji: string;
  rotation: number;
  isExcluded: boolean;
  pinPlain: string;
}

interface EditFolderDialogProps {
  folder: FolderData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditFolderDialog({
  folder,
  open,
  onOpenChange,
  onUpdated,
}: EditFolderDialogProps) {
  const [name, setName] = useState(folder.name);
  const [emoji, setEmoji] = useState(folder.emoji);
  const [pin, setPin] = useState(folder.pinPlain);
  const [rotation, setRotation] = useState(folder.rotation ?? 0);
  const [isExcluded, setIsExcluded] = useState(folder.isExcluded);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");

      if (!name.trim()) {
        setError("Display name can't be empty.");
        return;
      }
      if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
        setError("Exit PIN must be exactly 4 digits.");
        return;
      }

      setLoading(true);
      try {
        const updates: Record<string, unknown> = {};
        if (name.trim() !== folder.name) updates.name = name.trim();
        if (emoji !== folder.emoji) updates.emoji = emoji;
        if (isExcluded !== folder.isExcluded) updates.isExcluded = isExcluded;
        if (rotation !== (folder.rotation ?? 0)) updates.rotation = rotation;
        if (pin !== folder.pinPlain) updates.pin = pin;

        if (Object.keys(updates).length === 0) {
          onUpdated();
          return;
        }

        const res = await fetch(`/api/folders/${folder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Couldn't update display.");
          return;
        }

        onUpdated();
      } catch {
        setError("Can't connect right now. Check your internet and try again.");
      } finally {
        setLoading(false);
      }
    },
    [name, emoji, pin, rotation, isExcluded, folder, onUpdated]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Display</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>

            <Separator />

            {/* Exit PIN */}
            <div className="space-y-2">
              <Label htmlFor="edit-pin">Exit PIN (for TV slideshow)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(v);
                    setError("");
                  }}
                  placeholder="0000"
                  maxLength={4}
                  inputMode="numeric"
                  disabled={loading}
                  className="font-mono tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Staff enter this PIN to exit the slideshow on the TV.
              </p>
            </div>

            <Separator />

            {/* Orientation */}
            <div className="space-y-2">
              <Label>Content Orientation</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={rotation === 0 ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setRotation(0)}
                  disabled={loading}
                >
                  <Monitor className="w-3 h-3 mr-1.5" />
                  Horizontal
                </Button>
                <Button
                  type="button"
                  variant={rotation !== 0 ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setRotation(90)}
                  disabled={loading}
                >
                  <Smartphone className="w-3 h-3 mr-1.5" />
                  Vertical
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                What kind of content is in this folder — landscape or portrait videos/images.
              </p>
            </div>

            <Separator />

            {/* Visibility */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Hide from TVs</Label>
                <p className="text-xs text-muted-foreground">
                  Hidden displays won't show on Android TV devices.
                </p>
              </div>
              <Button
                type="button"
                variant={isExcluded ? "default" : "outline"}
                size="sm"
                onClick={() => setIsExcluded(!isExcluded)}
              >
                {isExcluded ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1.5" />
                    Hidden
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1.5" />
                    Visible
                  </>
                )}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
