import { ArrowRight } from 'lucide-react'
import { Link } from 'wouter'
import { Button } from '../ui/button'

function CTASection() {
    return (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" >
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 text-white">
                    Ready to Transform Your Trading?
                </h2>
                <p className="text-lg lg:text-xl mb-6 lg:mb-8 text-white/90 px-4">
                    Join thousands of traders using our professional analytics platform
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    <Button
                        size="lg"
                        variant="outline"
                        className="text-white border-white hover:bg-white hover:text-primary"
                        asChild
                    >
                        <Link href="/auth">Create New Account</Link>
                    </Button>
                </div>

                <div className="text-sm text-white/70 mb-8">
                    No credit card required • Cancel anytime • 24/7 support
                </div>

                {/* Navigation Flow Steps */}
                <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <div className="flex items-center justify-center space-x-4 sm:space-x-8 text-xs sm:text-sm text-white">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white text-primary rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                                1
                            </div>
                            <span className="hidden sm:inline">Sign Up</span>
                            <span className="sm:hidden">Sign</span>
                        </div>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-white/70" />
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white text-primary rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                                2
                            </div>
                            <span className="hidden sm:inline">Choose Plan</span>
                            <span className="sm:hidden">Plan</span>
                        </div>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-white/70" />
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white text-primary rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                                3
                            </div>
                            <span className="hidden sm:inline">Start Trading</span>
                            <span className="sm:hidden">Trade</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CTASection