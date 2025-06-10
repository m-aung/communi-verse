export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border py-6 fixed bottom-0 left-0 w-full z-40">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CommuniVerse. All rights reserved.
      </div>
    </footer>
  );
}
