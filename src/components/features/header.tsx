interface IHeader {
  title: string
  subTitle: React.ReactNode | string
}

function Header({ title, subTitle }: IHeader) {
  return (
    <header className="mb-5 border-b border-border pb-5">
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground text-lg">{subTitle}</p>
    </header>
  )
}

export default Header
