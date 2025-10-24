import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

export function GameRulesModal({ buttonText }: { buttonText?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {buttonText ? (
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {buttonText}
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Rules & Guidelines</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">How It Works</h3>
            <p className="text-xs text-muted-foreground">
              All normal players see the secret word. Imposters see: "You are the imposter!"
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Gameplay</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Describe the word without saying it directly</li>
              <li className="font-semibold text-foreground text-xs">Example: "Pizza"</li>
              <li className="text-xs ml-4">✓ "It's round and cheesy"</li>
              <li className="text-xs ml-4">✗ "Order from Domino's"</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Discussion & Voting</h3>
            <p className="text-xs text-muted-foreground">
              Listen carefully, spot suspicious behavior, then vote on who's the imposter.
            </p>
          </div>
        </div>

        <div className="border-t pt-2 mt-4">
          <p className="text-xs text-center text-muted-foreground">
            Made by{" "}
            <a
              href="https://salmanshahriar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer"
            >
              Salman Shahriar
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
